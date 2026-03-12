import type {
  ContentResource,
  GlossaryTerm,
  QuestionMetadata,
} from "@/data/curriculum";
import {
  getMarkSchemeConceptsForQuestion,
  getTopicContentBundle,
} from "./content";
import { findPhraseEvidence, stringSimilarity, tokenOverlapScore } from "./intelligence/fuzzy";
import { normalizeText } from "./intelligence/normalize";
import { getTopicById, getTopicTree, TOPICS } from "./types";

export type PracticeSetKind = "recall" | "exam-drill" | "quiz";

export interface PracticeRecallCard {
  id: string;
  topicId: string;
  title: string;
  prompt: string;
  answer: string;
  hint?: string;
  kind: "term" | "curriculum-point";
  tags: string[];
  relatedResourceIds: string[];
  relatedQuestionIds: string[];
  nextStep: string;
}

export interface PracticeExamDrill {
  id: string;
  topicId: string;
  questionId: string;
  title: string;
  sourceLabel: string;
  marks?: number;
  prompt: string;
  answerFocus: string;
  checklist: string[];
  linkedResourceIds: string[];
  sourceType?: "past-paper" | "official-point";
}

export interface PracticeQuizQuestion {
  id: string;
  topicId: string;
  type: "multiple-choice" | "short-answer";
  question: string;
  options?: string[];
  correctAnswer: string;
  acceptableAnswers?: string[];
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  subtopicLabel?: string;
  sourceLabel?: string;
}

export interface PracticeResourceStep {
  id: string;
  label: string;
  why: string;
  resource: ContentResource | null;
}

export interface TopicPracticeBundle {
  topicId: string;
  topicLabel: string;
  recallCards: PracticeRecallCard[];
  examDrills: PracticeExamDrill[];
  quizQuestions: PracticeQuizQuestion[];
  resourceSteps: PracticeResourceStep[];
}

export interface PracticeShortAnswerCheckResult {
  isCorrect: boolean;
  matchedCue: string | null;
  confidence: number;
}

function uniqueStrings(values: Array<string | undefined | null>) {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean))] as string[];
}

function getTopicSubtopicLabel(topicId: string, index = 0) {
  const tree = getTopicTree(topicId);

  if (!tree || tree.subtopics.length === 0) {
    return undefined;
  }

  return tree.subtopics[index % tree.subtopics.length]?.label;
}

function rotateDeterministically<T>(values: T[], seed: string) {
  if (values.length <= 1) {
    return values;
  }

  const offset =
    [...seed].reduce((sum, character) => sum + character.charCodeAt(0), 0) %
    values.length;

  return values.slice(offset).concat(values.slice(0, offset));
}

function buildTermMultipleChoiceQuestion(
  topicId: string,
  term: GlossaryTerm,
  allTerms: GlossaryTerm[]
): PracticeQuizQuestion | null {
  const distractors = allTerms.filter((candidate) => candidate.id !== term.id);
  const optionsPool = uniqueStrings(
    rotateDeterministically(
      distractors.map((candidate) => candidate.term),
      term.id
    )
  ).slice(0, 3);

  if (optionsPool.length < 3) {
    return null;
  }

  const options = rotateDeterministically(
    [term.term, ...optionsPool],
    `option-${term.id}`
  ).slice(0, 4);

  return {
    id: `quiz-term-${term.id}`,
    topicId,
    type: "multiple-choice",
    question: `Which term best matches this description: ${term.definition}`,
    options,
    correctAnswer: term.term,
    explanation: `${term.term}: ${term.definition}`,
    difficulty: "easy",
    subtopicLabel: getTopicSubtopicLabel(topicId),
    sourceLabel: "Glossary recall",
  };
}

function buildSubtopicQuestion(topicId: string): PracticeQuizQuestion[] {
  const tree = getTopicTree(topicId);

  if (!tree || tree.subtopics.length < 2) {
    return [];
  }

  return tree.subtopics.map((subtopic, index) => {
    const distractorLabels = rotateDeterministically(
      tree.subtopics
        .filter((candidate) => candidate.id !== subtopic.id)
        .map((candidate) => candidate.label),
      subtopic.id
    ).slice(0, 3);

    const options = rotateDeterministically(
      [subtopic.label, ...distractorLabels],
      `subtopic-${subtopic.id}`
    );

    return {
      id: `quiz-subtopic-${subtopic.id}`,
      topicId,
      type: "multiple-choice",
      question: `Which subtopic is most closely linked to ${subtopic.keywords
        .slice(0, 3)
        .join(", ")}?`,
      options,
      correctAnswer: subtopic.label,
      explanation: `${subtopic.label} covers ideas such as ${subtopic.keywords
        .slice(0, 4)
        .join(", ")}.`,
      difficulty: index > 1 ? "medium" : "easy",
      subtopicLabel: subtopic.label,
      sourceLabel: "Topic coverage",
    };
  });
}

function extractQuestionCues(question: QuestionMetadata) {
  const markSchemeCues = getMarkSchemeConceptsForQuestion(question.id)
    .flatMap((concept) => concept.conceptTargets)
    .slice(0, 5);

  const expectationCues = question.expectation
    .split(/[.;]/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 8)
    .slice(0, 2);

  return uniqueStrings([...markSchemeCues, ...expectationCues]);
}

function buildExamPromptQuestion(
  topicId: string,
  question: QuestionMetadata
): PracticeQuizQuestion {
  const cues = extractQuestionCues(question);

  return {
    id: `quiz-exam-${question.id}`,
    topicId,
    type: "short-answer",
    question: question.practicePrompt,
    correctAnswer: cues[0] ?? question.expectation,
    acceptableAnswers: cues,
    explanation: question.expectation,
    difficulty:
      (question.marks ?? 0) >= 8
        ? "hard"
        : (question.marks ?? 0) >= 4
          ? "medium"
          : "easy",
    subtopicLabel: getTopicSubtopicLabel(topicId, 1),
    sourceLabel: question.sourceLabel,
  };
}

function getPromptDifficulty(prompt: string) {
  const normalizedPrompt = prompt.toLowerCase();

  if (
    normalizedPrompt.startsWith("evaluate") ||
    normalizedPrompt.startsWith("compare")
  ) {
    return {
      marks: 6,
      difficulty: "hard" as const,
    };
  }

  if (
    normalizedPrompt.startsWith("explain two") ||
    normalizedPrompt.startsWith("describe two")
  ) {
    return {
      marks: 5,
      difficulty: "medium" as const,
    };
  }

  return {
    marks: 4,
    difficulty: "medium" as const,
  };
}

function pickResource(
  resources: ContentResource[],
  allowedKinds: ContentResource["kind"][]
) {
  return (
    resources.find((resource) => allowedKinds.includes(resource.kind)) ?? null
  );
}

function getResourceSteps(topicId: string): PracticeResourceStep[] {
  const bundle = getTopicContentBundle(topicId);
  const learnResource = pickResource(bundle.resources, ["textbook", "specification"]);
  const testResource = pickResource(bundle.resources, ["question-bank", "past-paper"]);
  const reviewResource = pickResource(bundle.resources, ["mark-scheme"]);

  return [
    {
      id: `${topicId}-learn`,
      label: "Learn first",
      why: "Use a concise note/spec source before you try recall from memory.",
      resource: learnResource,
    },
    {
      id: `${topicId}-test`,
      label: "Then test it",
      why: "Move into question-bank or past-paper style prompts once the terms feel familiar.",
      resource: testResource,
    },
    {
      id: `${topicId}-review`,
      label: "Then review gaps",
      why: "Compare your recall with mark-scheme language so you can tighten exam wording.",
      resource: reviewResource,
    },
  ];
}

export function getPracticeSetId(topicId: string, kind: PracticeSetKind) {
  return `practice:${kind}:${topicId}`;
}

export function getTopicPracticeBundle(topicId: string): TopicPracticeBundle {
  const topicInfo = getTopicById(topicId);
  const bundle = getTopicContentBundle(topicId);
  const officialPointCards = bundle.officialPoints.map((point) => ({
    id: `recall-point-${point.id}`,
    topicId,
    title: `${point.code} ${point.title}`,
    prompt: `Explain what ${point.code} covers and why it matters in ${topicInfo?.label ?? "this topic"}.`,
    answer: point.summary,
    hint:
      point.relatedTerms.length > 0
        ? `Exam terms: ${point.relatedTerms.slice(0, 3).join(", ")}`
        : undefined,
    kind: "curriculum-point" as const,
    tags: uniqueStrings([...point.relatedTerms.slice(0, 3), ...point.relatedConcepts.slice(0, 2)]),
    relatedResourceIds: bundle.resources
      .filter((resource) => resource.curriculumPointIds.includes(point.id))
      .slice(0, 2)
      .map((resource) => resource.id),
    relatedQuestionIds: bundle.questions
      .filter((question) => question.curriculumPointIds.includes(point.id))
      .slice(0, 2)
      .map((question) => question.id),
    nextStep: "Try to give one example or exam scenario that uses this point.",
  }));

  const termCards = bundle.terms.map((term) => ({
    id: `recall-term-${term.id}`,
    topicId,
    title: term.term,
    prompt: `Define ${term.term} in your own words.`,
    answer: term.definition,
    hint:
      term.aliases && term.aliases.length > 0
        ? `Also appears as ${term.aliases.slice(0, 2).join(", ")}`
        : undefined,
    kind: "term" as const,
    tags: uniqueStrings([
      ...(term.aliases ?? []).slice(0, 3),
      ...bundle.officialPoints
        .filter((point) => term.curriculumPointIds.includes(point.id))
        .flatMap((point) => point.relatedConcepts.slice(0, 2)),
    ]),
    relatedResourceIds: bundle.resources
      .filter((resource) =>
        resource.curriculumPointIds.some((pointId) =>
          term.curriculumPointIds.includes(pointId)
        )
      )
      .slice(0, 2)
      .map((resource) => resource.id),
    relatedQuestionIds: bundle.questions
      .filter((question) =>
        question.curriculumPointIds.some((pointId) =>
          term.curriculumPointIds.includes(pointId)
        )
      )
      .slice(0, 2)
      .map((question) => question.id),
    nextStep: "Say where this term could appear in an exam answer or scenario.",
  }));

  const allTerms = TOPICS.flatMap((topic) => getTopicContentBundle(topic.id).terms);
  const quizQuestions = [
    ...bundle.terms
      .map((term) => buildTermMultipleChoiceQuestion(topicId, term, allTerms))
      .filter((question): question is PracticeQuizQuestion => Boolean(question)),
    ...buildSubtopicQuestion(topicId),
    ...bundle.questions.map((question) => buildExamPromptQuestion(topicId, question)),
    ...bundle.officialPoints.flatMap((point, pointIndex) =>
      point.practicePrompts.slice(0, 2).map((prompt, promptIndex) => {
        const difficulty = getPromptDifficulty(prompt);

        return {
          id: `quiz-point-${point.id}-${promptIndex + 1}`,
          topicId,
          type: "short-answer" as const,
          question: prompt,
          correctAnswer: point.summary,
          acceptableAnswers: uniqueStrings([
            ...point.markSchemeIdeas,
            ...point.relatedConcepts,
            ...point.relatedTerms,
          ]).slice(0, 6),
          explanation: point.summary,
          difficulty:
            pointIndex > 2 && difficulty.difficulty === "medium"
              ? "hard"
              : difficulty.difficulty,
          subtopicLabel: `${point.code} ${point.title}`,
          sourceLabel: "Official point drill",
        };
      })
    ),
  ];

  const questionDrills = bundle.questions.map((question) => {
    const conceptTargets = getMarkSchemeConceptsForQuestion(question.id)
      .flatMap((concept) => concept.conceptTargets)
      .slice(0, 4);
    const linkedResourceIds = bundle.resources
      .filter(
        (resource) =>
          resource.kind === "past-paper" ||
          resource.kind === "mark-scheme" ||
          resource.kind === "question-bank"
      )
      .slice(0, 3)
      .map((resource) => resource.id);

    return {
      id: `exam-drill-${question.id}`,
      topicId,
      questionId: question.id,
      title: question.title,
      sourceLabel: question.sourceLabel,
      marks: question.marks,
      prompt: question.practicePrompt,
      answerFocus: question.expectation,
      checklist:
        conceptTargets.length > 0
          ? conceptTargets
          : [question.expectation],
      linkedResourceIds,
      sourceType: "past-paper" as const,
    };
  });

  const curriculumDrills = bundle.officialPoints.flatMap((point) =>
    point.practicePrompts.map((prompt, index) => {
      const promptMeta = getPromptDifficulty(prompt);
      const linkedResourceIds = bundle.resources
        .filter((resource) => resource.curriculumPointIds.includes(point.id))
        .slice(0, 3)
        .map((resource) => resource.id);

      return {
        id: `exam-drill-point-${point.id}-${index + 1}`,
        topicId,
        questionId: `point-${point.id}-${index + 1}`,
        title: `${point.code} ${point.title}`,
        sourceLabel: `Official point ${point.code}`,
        marks: promptMeta.marks,
        prompt,
        answerFocus: point.summary,
        checklist: uniqueStrings([
          ...point.markSchemeIdeas,
          ...point.relatedConcepts.map((concept) => `Link ${concept} to the scenario.`),
          ...point.relatedTerms.slice(0, 2).map((term) => `Use ${term} accurately.`),
        ]).slice(0, 5),
        linkedResourceIds,
        sourceType: "official-point" as const,
      };
    })
  );

  return {
    topicId,
    topicLabel: topicInfo?.label ?? topicId,
    recallCards: [...termCards, ...officialPointCards],
    examDrills: [...questionDrills, ...curriculumDrills],
    quizQuestions,
    resourceSteps: getResourceSteps(topicId),
  };
}

export function getQuickQuizQuestionPool(topicId?: string) {
  if (topicId) {
    return getTopicPracticeBundle(topicId).quizQuestions;
  }

  return TOPICS.filter((topic) => topic.id !== "esp").flatMap((topic) =>
    getTopicPracticeBundle(topic.id).quizQuestions
  );
}

export function evaluatePracticeShortAnswer(
  answer: string,
  question: PracticeQuizQuestion
): PracticeShortAnswerCheckResult {
  const normalizedAnswer = normalizeText(answer);

  if (!normalizedAnswer.normalized) {
    return {
      isCorrect: false,
      matchedCue: null,
      confidence: 0,
    };
  }

  const cues = uniqueStrings([
    question.correctAnswer,
    ...(question.acceptableAnswers ?? []),
  ]);

  let bestCue: string | null = null;
  let bestScore = 0;

  for (const cue of cues) {
    const normalizedCue = normalizeText(cue);

    if (!normalizedCue.normalized) {
      continue;
    }

    let score = 0;

    if (
      normalizedAnswer.normalized.includes(normalizedCue.normalized) ||
      normalizedCue.normalized.includes(normalizedAnswer.normalized)
    ) {
      score = Math.max(score, 0.98);
    }

    const phraseEvidence = findPhraseEvidence(
      normalizedAnswer,
      normalizedCue.normalized
    );
    if (phraseEvidence) {
      score = Math.max(score, phraseEvidence.similarity);
    }

    score = Math.max(
      score,
      stringSimilarity(normalizedAnswer.normalized, normalizedCue.normalized),
      tokenOverlapScore(normalizedAnswer.tokens, normalizedCue.tokens)
    );

    if (score > bestScore) {
      bestScore = score;
      bestCue = cue;
    }
  }

  return {
    isCorrect: bestScore >= 0.72,
    matchedCue: bestCue,
    confidence: Math.min(1, Number(bestScore.toFixed(2))),
  };
}

export function getPracticeSetLabel(kind: PracticeSetKind) {
  if (kind === "recall") {
    return "Recall cycle";
  }

  if (kind === "exam-drill") {
    return "Exam drill";
  }

  return "Quick quiz";
}
