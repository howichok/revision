"use client";

import { useParams } from "next/navigation";
import { Card } from "@/components/ui";
import { useAppData } from "@/components/providers/app-data-provider";
import { TopicRouteShell } from "@/components/revision/topic-route-shell";
import {
  ExamDrillPanel,
  TopicSupportResourcesCard,
} from "@/components/revision/topic-learning-modes";
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
    <TopicRouteShell
      topicId={topicId}
      activeMode="exam-drill"
      eyebrow="Guided exam practice"
      title={`${topicInfo.label} exam drill`}
      description="One focused planning route. Use it to structure an answer, compare it against the checklist, and decide whether you are really ready for exam wording."
      aside={
        <>
          <TopicSupportResourcesCard
            title="Support material"
            description="Use question-bank, past-paper, and mark-scheme material after you compare your plan with the checklist."
            resourceSteps={bundle.resourceSteps}
          />
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Important
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              This route is self-assessment and planning support. It helps you judge readiness before you move into full answer checking.
            </p>
          </Card>
        </>
      }
    >
      <ExamDrillPanel
        topicId={topicId}
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
    </TopicRouteShell>
  );
}

