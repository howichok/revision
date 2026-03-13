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
  description: string;
}> = [
  {
    id: "hub",
    label: "Revision Hub",
    href: "/revision",
    description: "Choose a revision path.",
  },
  {
    id: "diagnostic",
    label: "Diagnostic",
    href: "/revision/diagnostic",
    description: "Map your weak points first.",
  },
  {
    id: "topics",
    label: "Topics",
    href: "/revision/topics",
    description: "Open a topic workspace.",
  },
  {
    id: "quick-quiz",
    label: "Quick Quiz",
    href: "/revision/quick-quiz",
    description: "Fast retrieval across topics.",
  },
  {
    id: "paper-1",
    label: "Paper 1",
    href: "/revision/paper-1",
    description: "Theory-heavy exam practice.",
  },
  {
    id: "paper-2",
    label: "Paper 2",
    href: "/revision/paper-2",
    description: "Applied written practice.",
  },
  {
    id: "weak-areas",
    label: "Weak Areas",
    href: "/revision/weak-areas",
    description: "Review what still needs work.",
  },
  {
    id: "progress",
    label: "Progress",
    href: "/revision/progress",
    description: "See your saved revision state.",
  },
];

export const TOPIC_ROUTE_ITEMS: Array<{
  id: TopicLearningMode;
  label: string;
  description: string;
}> = [
  {
    id: "overview",
    label: "Overview",
    description: "Topic summary, curriculum points, and linked content.",
  },
  {
    id: "practice",
    label: "Practice Hub",
    description: "Choose recall, drills, checking, or quiz.",
  },
  {
    id: "recall",
    label: "Active Recall",
    description: "Recall cards and mastery signal.",
  },
  {
    id: "exam-drill",
    label: "Exam Drill",
    description: "Plan and self-check exam responses.",
  },
  {
    id: "answer-check",
    label: "Answer Check",
    description: "Check a written answer against the rubric.",
  },
  {
    id: "quiz",
    label: "Quick Quiz",
    description: "Short retrieval questions for this topic.",
  },
  {
    id: "exam-questions",
    label: "Exam Questions",
    description: "Mapped paper prompts and answer focus.",
  },
  {
    id: "resources",
    label: "Resources",
    description: "Topic-specific notes, papers, and schemes.",
  },
  {
    id: "progress",
    label: "Progress",
    description: "Saved topic progress and practice state.",
  },
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

