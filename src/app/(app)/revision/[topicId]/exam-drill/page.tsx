"use client";

import { useParams } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { useAppData } from "@/components/providers/app-data-provider";
import { ExamDrillPanel } from "@/components/revision/topic-learning-modes";
import { getPracticeSetId, getTopicPracticeBundle } from "@/lib/practice";
import { getPracticeSetProgress } from "@/lib/progress";
import { getTopicById } from "@/lib/types";

export default function TopicExamDrillPage() {
  const params = useParams();
  const topicId = typeof params.topicId === "string" ? params.topicId : "";
  const topicInfo = getTopicById(topicId);
  const { revisionProgress, trackPracticeSetProgress } = useAppData();

  if (!topicInfo) {
    return null;
  }

  const bundle = getTopicPracticeBundle(topicId);
  const practiceSetId = getPracticeSetId(topicId, "exam-drill");
  const examProgress =
    getPracticeSetProgress(revisionProgress, topicId, practiceSetId)?.progressPercent ?? 0;

  return (
    <PageContainer size="lg" className="max-w-[88rem]">
      <ExamDrillPanel
        topicId={topicId}
        topicLabel={topicInfo.label}
        topicIcon={topicInfo.icon}
        drills={bundle.examDrills}
        progressPercent={examProgress}
        onComplete={(progressPercent) =>
          trackPracticeSetProgress({
            practiceSetId,
            topicId,
            title: `${topicInfo.label} exam drill`,
            progressPercent,
            minutesSpent: Math.max(12, bundle.examDrills.length * 4),
          })
        }
      />
    </PageContainer>
  );
}
