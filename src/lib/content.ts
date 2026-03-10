import {
  CONTENT_RESOURCES,
  CONTENT_SOURCES,
  DSD_CURRICULUM_AREAS,
  DSD_CURRICULUM_POINTS,
  GLOSSARY_TERMS,
  LEGACY_TOPIC_MAPPINGS,
  MARK_SCHEME_CONCEPTS,
  QUESTION_METADATA,
} from "@/data/curriculum";
import type {
  ContentResource,
  ContentSource,
  CurriculumArea,
  CurriculumPoint,
  GlossaryTerm,
  LegacyTopicMapping,
  QuestionMetadata,
  RecommendedMaterial,
  StructuredSearchResults,
  TopicContentBundle,
} from "@/data/curriculum";
import { getTopicById, TOPICS, type TopicId } from "./types";

function normalizeSearchValue(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function buildSearchableText(values: Array<string | undefined>) {
  return normalizeSearchValue(values.filter(Boolean).join(" "));
}

function getQueryTokens(query: string) {
  return normalizeSearchValue(query).split(" ").filter(Boolean);
}

function scoreTextMatch(query: string, values: Array<string | undefined>) {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) {
    return 0;
  }

  const searchable = buildSearchableText(values);
  if (!searchable) {
    return 0;
  }

  let score = 0;
  if (searchable.includes(normalizedQuery)) {
    score += 12;
  }

  for (const token of getQueryTokens(query)) {
    if (searchable.includes(token)) {
      score += token.length > 4 ? 4 : 2;
    }
  }

  return score;
}

function intersects(left: string[], right: string[]) {
  return left.some((item) => right.includes(item));
}

function getLegacyTopicMapping(topicId: string): LegacyTopicMapping | null {
  return LEGACY_TOPIC_MAPPINGS.find((mapping) => mapping.topicId === topicId) ?? null;
}

function getPointIdsForLegacyTopic(topicId: string) {
  return getLegacyTopicMapping(topicId)?.officialPointIds ?? [];
}

function getPrimaryLegacyTopicLabel(topicIds: TopicId[]) {
  const topic = topicIds.map((topicId) => getTopicById(topicId)).find(Boolean);
  return topic?.label ?? "Cross-topic";
}

function getPrimaryLegacyTopicId(topicIds: TopicId[]) {
  return topicIds[0] ?? null;
}

function getPrimaryLegacyTopicIcon(topicIds: TopicId[]) {
  const topic = topicIds.map((topicId) => getTopicById(topicId)).find(Boolean);
  return topic?.icon ?? "•";
}

function toMaterialType(resource: ContentResource): RecommendedMaterial["type"] {
  switch (resource.kind) {
    case "past-paper":
      return "practice";
    case "mark-scheme":
      return "review";
    case "question-bank":
      return "practice";
    case "specification":
      return "guide";
    case "textbook":
    default:
      return "notes";
  }
}

function toMaterialDifficulty(resource: ContentResource): RecommendedMaterial["difficulty"] {
  if (resource.kind === "past-paper") {
    return "hard";
  }

  if (resource.kind === "mark-scheme" || resource.kind === "question-bank") {
    return "medium";
  }

  return "easy";
}

function getMaterialCta(resource: ContentResource) {
  switch (resource.kind) {
    case "past-paper":
      return "Practice";
    case "mark-scheme":
      return "Review";
    case "question-bank":
      return "Start questions";
    case "specification":
      return "Read outline";
    case "textbook":
    default:
      return "Open notes";
  }
}

export function getSourceInventory(): ContentSource[] {
  return CONTENT_SOURCES;
}

export function getCanonicalCurriculumAreas(): CurriculumArea[] {
  return DSD_CURRICULUM_AREAS;
}

export function getCanonicalCurriculumPoints(): CurriculumPoint[] {
  return DSD_CURRICULUM_POINTS;
}

export function getCurriculumPointById(pointId: string) {
  return DSD_CURRICULUM_POINTS.find((point) => point.id === pointId) ?? null;
}

export function getCurriculumAreaById(areaId: string) {
  return DSD_CURRICULUM_AREAS.find((area) => area.id === areaId) ?? null;
}

export function getGlossaryTermsForTopic(topicId: string): GlossaryTerm[] {
  return GLOSSARY_TERMS.filter((term) => term.legacyTopicIds.includes(topicId as TopicId));
}

export function getResourcesForTopic(topicId: string): ContentResource[] {
  return CONTENT_RESOURCES.filter((resource) =>
    resource.legacyTopicIds.includes(topicId as TopicId)
  );
}

export function getQuestionsForTopic(topicId: string): QuestionMetadata[] {
  return QUESTION_METADATA.filter((question) =>
    question.legacyTopicIds.includes(topicId as TopicId)
  );
}

export function getMarkSchemeConceptsForQuestion(questionId: string) {
  const question = QUESTION_METADATA.find((entry) => entry.id === questionId);
  if (!question) {
    return [];
  }

  return MARK_SCHEME_CONCEPTS.filter((concept) =>
    question.markSchemeConceptIds.includes(concept.id)
  );
}

export function getTopicContentBundle(topicId: string): TopicContentBundle {
  const mapping = getLegacyTopicMapping(topicId);
  const officialPointIds = mapping?.officialPointIds ?? [];
  const officialPoints = officialPointIds
    .map((pointId) => getCurriculumPointById(pointId))
    .filter((point): point is CurriculumPoint => Boolean(point));
  const terms = GLOSSARY_TERMS.filter(
    (term) =>
      term.legacyTopicIds.includes(topicId as TopicId) ||
      intersects(term.curriculumPointIds, officialPointIds)
  );
  const resources = CONTENT_RESOURCES.filter(
    (resource) =>
      resource.legacyTopicIds.includes(topicId as TopicId) ||
      intersects(resource.curriculumPointIds, officialPointIds)
  );
  const questions = QUESTION_METADATA.filter(
    (question) =>
      question.legacyTopicIds.includes(topicId as TopicId) ||
      intersects(question.curriculumPointIds, officialPointIds)
  );

  return {
    mapping,
    officialPoints,
    terms,
    resources,
    questions,
  };
}

export function getLibraryResources() {
  return [...CONTENT_RESOURCES].sort((left, right) => {
    if ((right.year ?? 0) !== (left.year ?? 0)) {
      return (right.year ?? 0) - (left.year ?? 0);
    }

    return left.title.localeCompare(right.title);
  });
}

export function getRecommendedMaterialCards(topicIds: string[], limit = 3): RecommendedMaterial[] {
  const uniqueTopicIds = Array.from(new Set(topicIds)).filter(Boolean) as TopicId[];
  const fallbackTopicIds = TOPICS.filter((topic) => topic.id !== "esp")
    .slice(0, 3)
    .map((topic) => topic.id);
  const activeTopicIds = uniqueTopicIds.length > 0 ? uniqueTopicIds : fallbackTopicIds;

  const selectedResources = CONTENT_RESOURCES.filter((resource) =>
    resource.legacyTopicIds.some((topicId) => activeTopicIds.includes(topicId))
  )
    .sort((left, right) => {
      const leftPriority =
        left.kind === "question-bank" || left.kind === "past-paper"
          ? 3
          : left.kind === "mark-scheme"
            ? 2
            : 1;
      const rightPriority =
        right.kind === "question-bank" || right.kind === "past-paper"
          ? 3
          : right.kind === "mark-scheme"
            ? 2
            : 1;

      if (rightPriority !== leftPriority) {
        return rightPriority - leftPriority;
      }

      return (right.year ?? 0) - (left.year ?? 0);
    })
    .slice(0, limit);

  return selectedResources.map((resource) => {
    const topicId = getPrimaryLegacyTopicId(resource.legacyTopicIds);

    return {
      resourceId: resource.id,
      id: resource.id,
      title: resource.title,
      description: resource.summary,
      topic: getPrimaryLegacyTopicLabel(resource.legacyTopicIds),
      topicId: topicId ?? undefined,
      topicIcon: getPrimaryLegacyTopicIcon(resource.legacyTopicIds),
      type: toMaterialType(resource),
      difficulty: toMaterialDifficulty(resource),
      estimatedMinutes: resource.estimatedMinutes,
      progress: 0,
      cta: getMaterialCta(resource),
    };
  });
}

export function searchStructuredContent(
  query: string,
  options: { legacyTopicId?: string } = {}
): StructuredSearchResults {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) {
    return {
      curriculumPoints: [],
      glossaryTerms: [],
      resources: [],
      questions: [],
    };
  }

  const pointIdsForTopic = options.legacyTopicId
    ? getPointIdsForLegacyTopic(options.legacyTopicId)
    : [];

  const curriculumPoints = DSD_CURRICULUM_POINTS.map((point) => ({
    point,
    score:
      scoreTextMatch(query, [
        point.code,
        point.title,
        point.summary,
        point.relatedTerms.join(" "),
        point.relatedConcepts.join(" "),
      ]) +
      (options.legacyTopicId && pointIdsForTopic.includes(point.id) ? 4 : 0),
  }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 6)
    .map((entry) => entry.point);

  const glossaryTerms = GLOSSARY_TERMS.map((term) => ({
    term,
    score:
      scoreTextMatch(query, [term.term, term.definition, term.aliases?.join(" ")]) +
      (options.legacyTopicId && term.legacyTopicIds.includes(options.legacyTopicId as TopicId) ? 4 : 0),
  }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 8)
    .map((entry) => entry.term);

  const resources = CONTENT_RESOURCES.map((resource) => ({
    resource,
    score:
      scoreTextMatch(query, [
        resource.title,
        resource.summary,
        resource.tags.join(" "),
      ]) +
      (options.legacyTopicId && resource.legacyTopicIds.includes(options.legacyTopicId as TopicId) ? 4 : 0),
  }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 6)
    .map((entry) => entry.resource);

  const questions = QUESTION_METADATA.map((question) => ({
    question,
    score:
      scoreTextMatch(query, [
        question.title,
        question.summary,
        question.expectation,
        question.practicePrompt,
      ]) +
      (options.legacyTopicId && question.legacyTopicIds.includes(options.legacyTopicId as TopicId) ? 4 : 0),
  }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 6)
    .map((entry) => entry.question);

  return {
    curriculumPoints,
    glossaryTerms,
    resources,
    questions,
  };
}
