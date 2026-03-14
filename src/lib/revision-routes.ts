export type RevisionRouteId =
  | "hub"
  | "diagnostic"
  | "topics"
  | "quick-quiz"
  | "paper-1"
  | "paper-2"
  | "weak-areas"
  | "progress";

export type TopicLearningMode =
  | "overview"
  | "practice"
  | "recall"
  | "exam-drill"
  | "answer-check"
  | "quiz"
  | "exam-questions"
  | "resources"
  | "progress";

export const REVISION_ROUTE_ITEMS: Array<{
  id: RevisionRouteId;
  label: string;
  href: string;
  description?: string;
}> = [
  { id: "topics", label: "Topics", href: "/revision/topics" },
  { id: "quick-quiz", label: "Quiz", href: "/revision/quick-quiz" },
  { id: "paper-1", label: "Paper 1", href: "/revision/paper-1" },
  { id: "paper-2", label: "Paper 2", href: "/revision/paper-2" },
  { id: "diagnostic", label: "Diagnostic", href: "/revision/diagnostic" },
  { id: "progress", label: "Progress", href: "/revision/progress" },
];

export const TOPIC_ROUTE_ITEMS: Array<{
  id: TopicLearningMode;
  label: string;
  description?: string;
}> = [
  { id: "overview", label: "Overview" },
  { id: "practice", label: "Practice" },
  { id: "exam-questions", label: "Exam Questions" },
  { id: "resources", label: "Resources" },
];

export function getTopicRouteHref(topicId: string, mode: TopicLearningMode) {
  return `/revision/${topicId}/${mode}`;
}

export function getTopicRouteItems(topicId: string) {
  return TOPIC_ROUTE_ITEMS.map((item) => ({
    ...item,
    href: getTopicRouteHref(topicId, item.id),
  }));
}

export function mapLegacyTopicTabToRoute(topicId: string, tab?: string | null) {
  switch (tab) {
    case "practice":
      return getTopicRouteHref(topicId, "practice");
    case "exam-questions":
      return getTopicRouteHref(topicId, "exam-questions");
    case "progress":
      return getTopicRouteHref(topicId, "progress");
    case "key-terms":
    case "subtopics":
    case "weak-areas":
    case "overview":
    case undefined:
    case null:
      return getTopicRouteHref(topicId, "overview");
    default:
      return getTopicRouteHref(topicId, "overview");
  }
}

