import { TOPICS, TOPIC_TREES } from "./types";
import type { MaterialCardData } from "@/components/ui";
import type {
  ActivityLog,
  DiagnosticResult,
  RevisionProgressEntry,
} from "./types";

export function getWeakestTopics(diagnostic: DiagnosticResult | null, count = 3) {
  if (!diagnostic) {
    return [];
  }

  return [...diagnostic.topicScores]
    .sort((left, right) => left.score / left.maxScore - right.score / right.maxScore)
    .slice(0, count);
}

export function formatRelativeTime(isoString: string) {
  const timestamp = new Date(isoString).getTime();
  const now = Date.now();
  const diffInMinutes = Math.max(1, Math.round((now - timestamp) / (1000 * 60)));

  if (diffInMinutes < 60) {
    return `${diffInMinutes} min ago`;
  }

  const diffInHours = Math.round(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
  }

  const diffInDays = Math.round(diffInHours / 24);
  if (diffInDays === 1) {
    return "Yesterday";
  }

  return `${diffInDays} days ago`;
}

export function getWeekActivity(activityHistory: ActivityLog[]) {
  const output = [0, 0, 0, 0, 0, 0, 0];
  const now = new Date();
  const startOfWeek = new Date(now);
  const offset = (now.getDay() + 6) % 7;
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - offset);

  activityHistory.forEach((entry) => {
    const date = new Date(entry.occurredAt);
    if (date < startOfWeek) {
      return;
    }
    const dayIndex = (date.getDay() + 6) % 7;
    output[dayIndex] += entry.minutesSpent > 0 ? entry.minutesSpent / 60 : 1;
  });

  return output;
}

export function getThisWeekMinutes(activityHistory: ActivityLog[]) {
  const now = new Date();
  const startOfWeek = new Date(now);
  const offset = (now.getDay() + 6) % 7;
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - offset);

  return activityHistory
    .filter((entry) => new Date(entry.occurredAt) >= startOfWeek)
    .reduce((sum, entry) => sum + entry.minutesSpent, 0);
}

export function getStudiedTopicCount(diagnostic: DiagnosticResult | null) {
  if (!diagnostic) {
    return 0;
  }

  return diagnostic.topicScores.filter(
    (topic) => (topic.score / topic.maxScore) * 100 >= 50
  ).length;
}

export function getSubtopicProgressForTopic(
  revisionProgress: RevisionProgressEntry[],
  topicId: string
) {
  const totalSubtopics =
    TOPIC_TREES.find((tree) => tree.topicId === topicId)?.subtopics.length ?? 0;
  const completed = revisionProgress.filter(
    (entry) =>
      entry.topicId === topicId &&
      entry.entityType === "subtopic" &&
      entry.status === "completed"
  ).length;

  const progressPercent =
    totalSubtopics === 0 ? 0 : Math.round((completed / totalSubtopics) * 100);

  return {
    totalSubtopics,
    completed,
    progressPercent,
  };
}

export function hydrateMaterialsWithProgress(
  materials: MaterialCardData[],
  revisionProgress: RevisionProgressEntry[]
) {
  const materialProgress = new Map(
    revisionProgress
      .filter((entry) => entry.entityType === "material")
      .map((entry) => [entry.entityId, entry.progressPercent])
  );

  return materials.map((material) => ({
    ...material,
    progress: materialProgress.get(material.id) ?? material.progress ?? 0,
  }));
}

export function resolveMaterialTopicId(material: Pick<MaterialCardData, "topic" | "topicId">) {
  if (material.topicId) {
    return material.topicId;
  }

  const normalizedTopic = material.topic.trim().toLowerCase();
  const match = TOPICS.find((topic) => {
    const normalizedLabel = topic.label.toLowerCase();
    const firstWord = normalizedLabel.split(" ")[0];

    return (
      normalizedLabel.includes(normalizedTopic) ||
      normalizedTopic.includes(firstWord)
    );
  });

  return match?.id ?? null;
}
