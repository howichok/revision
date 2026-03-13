import type {
  AnswerRubricSignalGroup,
  AnswerRubricSlot,
  QuestionEvaluationProfile,
} from "@/data/curriculum";
import { isNegated } from "./intelligence/context";
import { findPhraseEvidence, stringSimilarity, tokenOverlapScore } from "./intelligence/fuzzy";
import { normalizeText } from "./intelligence/normalize";
import type { PracticeQuizQuestion } from "./practice";

export interface PracticeRubricSlotEvaluation {
  id: string;
  label: string;
  status: "covered" | "partial" | "missing";
  scoreAwarded: number;
  maxScore: number;
  coverage: number;
  matchedEvidence: string[];
  missingEvidence: string[];
}

export interface PracticeShortAnswerEvaluation {
  isCorrect: boolean;
  matchedCue: string | null;
  confidence: number;
  score: number;
  maxScore: number;
  verdict: "strong" | "mostly-correct" | "partial" | "not-quite";
  verdictLabel: string;
  matchedSlots: string[];
  partialSlots: string[];
  missingSlots: string[];
  feedback: string;
  slotBreakdown: PracticeRubricSlotEvaluation[];
}

function roundToTenth(value: number) {
  return Math.round(value * 10) / 10;
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean))] as string[];
}

function describeGroup(group: AnswerRubricSignalGroup) {
  return group.anyOf.slice(0, 2).join(" / ");
}

function normalizeBritishAndAmericanSpelling(phrase: string) {
  return phrase
    .replace(/\bauthori[sz](ed|ation|e|ing)\b/g, (match) =>
      match.replace("s", "z")
    )
    .replace(/\bunauthori[sz](ed|ation|e|ing)\b/g, (match) =>
      match.replace("s", "z")
    );
}

function splitIntoSegments(answer: string) {
  return answer
    .split(/[\n\r]+|(?<=[.!?;:])\s+/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .map((segment) => normalizeText(segment));
}

function hasTokenSubset(textTokens: string[], candidateTokens: string[]) {
  return candidateTokens.every((token) => textTokens.includes(token));
}

function findBestSignalInSegment(
  segment: ReturnType<typeof normalizeText>,
  candidate: string
) {
  const normalizedCandidate = normalizeText(
    normalizeBritishAndAmericanSpelling(candidate)
  );

  if (!normalizedCandidate.normalized) {
    return null;
  }

  const phraseEvidence = findPhraseEvidence(segment, normalizedCandidate.normalized);
  if (phraseEvidence && !isNegated(segment.tokens, phraseEvidence.start, phraseEvidence.end)) {
    return {
      cue: candidate,
      similarity: phraseEvidence.similarity,
    };
  }

  if (hasTokenSubset(segment.tokens, normalizedCandidate.tokens)) {
    return {
      cue: candidate,
      similarity: 0.92,
    };
  }

  const overlap = tokenOverlapScore(segment.tokens, normalizedCandidate.tokens);
  if (
    normalizedCandidate.tokens.length >= 2 &&
    overlap >= 0.72
  ) {
    return {
      cue: candidate,
      similarity: overlap,
    };
  }

  const segmentSimilarity = stringSimilarity(
    segment.normalized,
    normalizedCandidate.normalized
  );
  if (segmentSimilarity >= 0.9) {
    return {
      cue: candidate,
      similarity: segmentSimilarity,
    };
  }

  return null;
}

function findBestSignal(
  segments: ReturnType<typeof normalizeText>[],
  group: AnswerRubricSignalGroup
) {
  let best: { cue: string; similarity: number } | null = null;

  for (const candidate of group.anyOf) {
    for (const segment of segments) {
      const evidence = findBestSignalInSegment(segment, candidate);
      if (!evidence) {
        continue;
      }

      if (!best || evidence.similarity > best.similarity) {
        best = evidence;
      }
    }
  }

  return best;
}

function evaluateRubricSlot(
  segments: ReturnType<typeof normalizeText>[],
  slot: AnswerRubricSlot
): PracticeRubricSlotEvaluation {
  const threshold = Math.max(1, Math.min(slot.minimumGroups ?? slot.groups.length, slot.groups.length));
  const matchedEvidence: string[] = [];
  const missingEvidence: string[] = [];
  let matchedGroups = 0;

  for (const group of slot.groups) {
    const evidence = findBestSignal(segments, group);
    if (evidence) {
      matchedGroups += 1;
      matchedEvidence.push(evidence.cue);
      continue;
    }

    missingEvidence.push(describeGroup(group));
  }

  const coverage = slot.groups.length > 0 ? matchedGroups / slot.groups.length : 0;
  const status: PracticeRubricSlotEvaluation["status"] =
    matchedGroups >= threshold
      ? "covered"
      : matchedGroups > 0
        ? "partial"
        : "missing";
  const scoreAwarded =
    status === "covered"
      ? slot.weight
      : status === "partial"
        ? roundToTenth(slot.weight * 0.55 * (matchedGroups / threshold))
        : 0;

  return {
    id: slot.id,
    label: slot.label,
    status,
    scoreAwarded,
    maxScore: slot.weight,
    coverage,
    matchedEvidence: uniqueStrings(matchedEvidence),
    missingEvidence,
  };
}

function buildFallbackEvaluation(
  answer: string,
  question: PracticeQuizQuestion
): PracticeShortAnswerEvaluation {
  const normalizedAnswer = normalizeText(answer);

  if (!normalizedAnswer.normalized) {
    return {
      isCorrect: false,
      matchedCue: null,
      confidence: 0,
      score: 0,
      maxScore: 1,
      verdict: "not-quite",
      verdictLabel: "Not quite",
      matchedSlots: [],
      partialSlots: [],
      missingSlots: ["Core answer focus"],
      feedback:
        "Your answer is too short to evaluate properly. State the main idea, explain it, and link it to the scenario.",
      slotBreakdown: [],
    };
  }

  const cues = uniqueStrings([
    question.correctAnswer,
    ...(question.acceptableAnswers ?? []),
  ]);
  const segments = splitIntoSegments(answer);
  let bestCue: string | null = null;
  let bestScore = 0;

  for (const cue of cues) {
    const signal = findBestSignal(segments, { anyOf: [cue] });
    if (!signal) {
      continue;
    }

    if (signal.similarity > bestScore) {
      bestScore = signal.similarity;
      bestCue = signal.cue;
    }
  }

  const verdict =
    bestScore >= 0.8
      ? "strong"
      : bestScore >= 0.62
        ? "mostly-correct"
        : bestScore >= 0.35
          ? "partial"
          : "not-quite";

  return {
    isCorrect: bestScore >= 0.62,
    matchedCue: bestCue,
    confidence: Math.min(1, roundToTenth(bestScore)),
    score: roundToTenth(bestScore),
    maxScore: 1,
    verdict,
    verdictLabel:
      verdict === "strong"
        ? "Strong answer"
        : verdict === "mostly-correct"
          ? "Mostly correct"
          : verdict === "partial"
            ? "Partially correct"
            : "Not quite",
    matchedSlots: bestCue ? ["Core answer focus"] : [],
    partialSlots: verdict === "partial" ? ["Core answer focus"] : [],
    missingSlots: bestCue ? [] : ["Core answer focus"],
    feedback:
      verdict === "strong"
        ? "This answer clearly matches the expected idea."
        : verdict === "mostly-correct"
          ? "This is directionally correct, but the explanation could be a little clearer or more specific."
          : verdict === "partial"
            ? "You are pointing in the right direction, but the explanation is underdeveloped."
            : "This does not yet show the main answer idea clearly enough.",
    slotBreakdown: [],
  };
}

function getDepthPenalty(profile: QuestionEvaluationProfile | undefined, answerTokenCount: number) {
  if (!profile?.depthExpectation) {
    return 0;
  }

  if (profile.depthExpectation === "developed" && answerTokenCount < 22) {
    return 0.12;
  }

  if (profile.depthExpectation === "explained" && answerTokenCount < 12) {
    return 0.08;
  }

  return 0;
}

function buildSlotFeedback(
  evaluation: {
    score: number;
    maxScore: number;
    matchedSlots: string[];
    partialSlots: string[];
    missingSlots: string[];
  },
  slots: AnswerRubricSlot[],
  profile: QuestionEvaluationProfile | undefined
) {
  const matchedText = evaluation.matchedSlots.slice(0, 2).join(" and ");
  const partialText = evaluation.partialSlots.slice(0, 2).join(" and ");
  const missingSlotFeedback = slots
    .filter((slot) => evaluation.missingSlots.includes(slot.label))
    .slice(0, 2)
    .map((slot) => slot.missingFeedback);

  const parts: string[] = [];

  if (evaluation.score >= evaluation.maxScore * 0.78) {
    parts.push("This is a strong answer that covers the key ideas well.");
  } else if (evaluation.score >= evaluation.maxScore * 0.55) {
    parts.push("This answer is mostly correct and covers most of the important ideas.");
  } else if (evaluation.score > 0) {
    parts.push("This answer has some correct ideas, but it is still underdeveloped.");
  } else {
    parts.push("This answer does not yet cover the key marking points clearly enough.");
  }

  if (matchedText) {
    parts.push(`You clearly covered ${matchedText}.`);
  }

  if (partialText) {
    parts.push(`Develop ${partialText} more explicitly to secure more marks.`);
  }

  if (missingSlotFeedback.length > 0) {
    parts.push(missingSlotFeedback.join(" "));
  }

  if (profile?.strongAnswerGuidance && evaluation.score < evaluation.maxScore * 0.78) {
    parts.push(profile.strongAnswerGuidance);
  }

  return parts.join(" ");
}

export function getAcceptedAnswerCues(question: PracticeQuizQuestion) {
  if (question.evaluationProfile?.slots?.length) {
    return question.evaluationProfile.slots.map((slot) => slot.label);
  }

  return uniqueStrings([
    question.correctAnswer,
    ...(question.acceptableAnswers ?? []),
  ]);
}

export function evaluatePracticeShortAnswer(
  answer: string,
  question: PracticeQuizQuestion
): PracticeShortAnswerEvaluation {
  if (!question.evaluationProfile) {
    return buildFallbackEvaluation(answer, question);
  }

  const normalizedAnswer = normalizeText(answer);
  if (!normalizedAnswer.normalized) {
    return buildFallbackEvaluation(answer, question);
  }

  const segments = splitIntoSegments(answer);
  const slotBreakdown = question.evaluationProfile.slots.map((slot) =>
    evaluateRubricSlot(segments, slot)
  );
  const score = roundToTenth(
    slotBreakdown.reduce((sum, slot) => sum + slot.scoreAwarded, 0)
  );
  const maxScore = roundToTenth(
    question.evaluationProfile.slots.reduce((sum, slot) => sum + slot.weight, 0)
  );
  const depthPenalty = getDepthPenalty(
    question.evaluationProfile,
    normalizedAnswer.tokens.length
  );
  const finalScore = Math.max(0, roundToTenth(score - maxScore * depthPenalty));
  const matchedSlots = slotBreakdown
    .filter((slot) => slot.status === "covered")
    .map((slot) => slot.label);
  const partialSlots = slotBreakdown
    .filter((slot) => slot.status === "partial")
    .map((slot) => slot.label);
  const missingSlots = slotBreakdown
    .filter((slot) => slot.status === "missing")
    .map((slot) => slot.label);
  const slotCoverage =
    slotBreakdown.length > 0
      ? slotBreakdown.reduce((sum, slot) => sum + slot.coverage, 0) / slotBreakdown.length
      : 0;
  const confidence = Math.min(
    0.98,
    roundToTenth(
      0.28 +
        slotCoverage * 0.48 +
        Math.min(normalizedAnswer.tokens.length / 36, 1) * 0.16 +
        Math.min(finalScore / Math.max(maxScore, 1), 1) * 0.16
    )
  );
  const verdict =
    finalScore >= maxScore * 0.78
      ? "strong"
      : finalScore >= maxScore * 0.55
        ? "mostly-correct"
        : finalScore > 0
          ? "partial"
          : "not-quite";

  return {
    isCorrect: finalScore >= maxScore * 0.55,
    matchedCue: slotBreakdown.find((slot) => slot.matchedEvidence.length > 0)?.matchedEvidence[0] ?? null,
    confidence,
    score: finalScore,
    maxScore,
    verdict,
    verdictLabel:
      verdict === "strong"
        ? "Strong answer"
        : verdict === "mostly-correct"
          ? "Mostly correct"
          : verdict === "partial"
            ? "Partially correct"
            : "Not quite",
    matchedSlots,
    partialSlots,
    missingSlots,
    feedback: buildSlotFeedback(
      {
        score: finalScore,
        maxScore,
        matchedSlots,
        partialSlots,
        missingSlots,
      },
      question.evaluationProfile.slots,
      question.evaluationProfile
    ),
    slotBreakdown,
  };
}
