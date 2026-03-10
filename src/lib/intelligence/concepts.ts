import { isNegated } from "./context";
import { findPhraseEvidence } from "./fuzzy";
import type {
  ConceptEvaluation,
  MisconceptionEvaluation,
  NormalizedText,
  PhraseEvidence,
  PhraseGroupRule,
  RevisionConceptRule,
  RevisionMisconceptionRule,
} from "./types";

function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

function describeGroup(group: PhraseGroupRule): string {
  return group.anyOf.slice(0, 2).join(" / ");
}

function findBestGroupEvidence(
  text: NormalizedText,
  group: PhraseGroupRule
): PhraseEvidence | null {
  let best: PhraseEvidence | null = null;

  for (const candidate of group.anyOf) {
    const evidence = findPhraseEvidence(text, candidate);
    if (!evidence) {
      continue;
    }

    evidence.negated = isNegated(text.tokens, evidence.start, evidence.end);

    if (evidence.negated) {
      continue;
    }

    if (!best || evidence.similarity > best.similarity) {
      best = evidence;
    }
  }

  return best;
}

export function evaluateConcept(
  text: NormalizedText,
  rule: RevisionConceptRule
): ConceptEvaluation {
  const matchedEvidence: string[] = [];
  const missingEvidence: string[] = [];
  let matchedGroups = 0;

  for (const group of rule.requiredGroups) {
    const evidence = findBestGroupEvidence(text, group);

    if (evidence) {
      matchedGroups += 1;
      matchedEvidence.push(evidence.phrase);
      continue;
    }

    missingEvidence.push(describeGroup(group));
  }

  const coverage = rule.requiredGroups.length
    ? matchedGroups / rule.requiredGroups.length
    : 0;
  const scoreAwarded = roundToHalf(rule.weight * coverage);

  return {
    id: rule.id,
    label: rule.label,
    scoreAwarded,
    maxScore: rule.weight,
    coverage,
    matchedEvidence,
    missingEvidence,
  };
}

export function evaluateMisconception(
  text: NormalizedText,
  rule: RevisionMisconceptionRule
): MisconceptionEvaluation | null {
  for (const group of rule.groups) {
    const evidence = findBestGroupEvidence(text, group);
    if (!evidence) {
      continue;
    }

    return {
      id: rule.id,
      label: rule.label,
      explanation: rule.explanation,
      penaltyApplied: rule.penalty,
    };
  }

  return null;
}
