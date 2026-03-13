"use client";

import { useParams } from "next/navigation";
import { Card } from "@/components/ui";
import { useAppData } from "@/components/providers/app-data-provider";
import { TopicRouteShell } from "@/components/revision/topic-route-shell";
import {
  RecallPanel,
  TopicSupportResourcesCard,
} from "@/components/revision/topic-learning-modes";
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
    <TopicRouteShell
      topicId={topicId}
      activeMode="recall"
      eyebrow="Active recall"
      title={`${topicInfo.label} recall cycle`}
      description="One focused retrieval task: recall the idea first, then reveal the answer and rate how well you genuinely knew it."
      aside={
        <>
          <TopicSupportResourcesCard
            title="Support material"
            description="Open support material after you identify what you could not recall confidently."
            resourceSteps={bundle.resourceSteps}
          />
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Outcome
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              This route ends with a mastery signal and a clear next step into answer checking or another recall round.
            </p>
          </Card>
        </>
      }
    >
      <RecallPanel
        topicId={topicId}
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
    </TopicRouteShell>
  );
}

