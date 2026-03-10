import type {
  CommunityContentEvaluation,
  MisconceptionEvaluation,
  RevisionAnswerEvaluation,
  RevisionConceptRule,
} from "./types";

export function buildRevisionFeedback(
  answerTokenCount: number,
  conceptRules: RevisionConceptRule[],
  partialConcepts: string[],
  evaluation: Pick<
    RevisionAnswerEvaluation,
    "score" | "maxScore" | "matchedConcepts" | "missingConcepts"
  >,
  misconceptions: MisconceptionEvaluation[]
): string {
  if (answerTokenCount < 4) {
    return "Your answer is too short to show the main ideas. Add the key concept, explain what it does, and link it to the scenario.";
  }

  const matchedRuleFeedback = conceptRules
    .filter((rule) => evaluation.matchedConcepts.includes(rule.label))
    .slice(0, 2)
    .map((rule) => rule.feedback);

  const feedbackParts: string[] = [];

  if (evaluation.score >= evaluation.maxScore * 0.75) {
    feedbackParts.push("Strong coverage of the main marking points.");
  } else if (evaluation.score >= evaluation.maxScore * 0.4) {
    feedbackParts.push("You have part of the right idea, but some mark-scheme points are still missing.");
  } else {
    feedbackParts.push("The answer only shows limited coverage of the expected concepts.");
  }

  if (matchedRuleFeedback.length) {
    feedbackParts.push(`You clearly covered ${matchedRuleFeedback.join(" and ")}.`);
  }

  if (partialConcepts.length) {
    feedbackParts.push(
      `Develop ${partialConcepts.slice(0, 2).join(" and ")} more fully to secure the remaining marks.`
    );
  }

  if (evaluation.missingConcepts.length) {
    feedbackParts.push(
      `Add ${evaluation.missingConcepts.slice(0, 2).join(" and ")} to reach more of the available marks.`
    );
  }

  if (misconceptions.length) {
    feedbackParts.push(
      `Check this misconception: ${misconceptions[0].explanation}`
    );
  }

  return feedbackParts.join(" ");
}

export function buildCommunityReasons(
  evaluation: CommunityContentEvaluation
): string[] {
  const reasons = [...evaluation.reasons];

  if (!reasons.length && evaluation.qualityScore >= 75 && evaluation.relevanceScore >= 45) {
    reasons.push("The content is specific enough to be useful and stays reasonably aligned with the topic.");
  }

  if (!reasons.length && evaluation.qualityScore < 45) {
    reasons.push("The content is too thin to add reliable learning value.");
  }

  if (!reasons.length && evaluation.relevanceScore < 45) {
    reasons.push("The content needs clearer topic-specific language to feel properly aligned.");
  }

  if (!reasons.length) {
    reasons.push("No major moderation risk was detected, but the content could still be made more specific.");
  }

  return reasons;
}
