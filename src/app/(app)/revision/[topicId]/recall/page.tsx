"use client";

import { useParams } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { useAppData } from "@/components/providers/app-data-provider";
import { RecallPanel } from "@/components/revision/topic-learning-modes";
import { getPracticeSetId, getTopicPracticeBundle } from "@/lib/practice";
import { getPracticeSetProgress } from "@/lib/progress";
import { getTopicById } from "@/lib/types";

export default function TopicRecallPage() {
  const params = useParams();
  const topicId = typeof params.topicId === "string" ? params.topicId : "";
  const topicInfo = getTopicById(topicId);
  const { revisionProgress, trackPracticeSetProgress } = useAppData();

  if (!topicInfo) {
    return null;
  }

  const bundle = getTopicPracticeBundle(topicId);
  const practiceSetId = getPracticeSetId(topicId, "recall");
  const recallProgress =
    getPracticeSetProgress(revisionProgress, topicId, practiceSetId)?.progressPercent ?? 0;

  return (
    <PageContainer size="lg" className="max-w-[88rem]">
      <RecallPanel
        topicId={topicId}
        topicLabel={topicInfo.label}
        topicIcon={topicInfo.icon}
        cards={bundle.recallCards}
        progressPercent={recallProgress}
        onComplete={(progressPercent) =>
          trackPracticeSetProgress({
            practiceSetId,
            topicId,
            title: `${topicInfo.label} recall cycle`,
            progressPercent,
            minutesSpent: Math.max(10, bundle.recallCards.length * 2),
          })
        }
      />
    </PageContainer>
  );
}
