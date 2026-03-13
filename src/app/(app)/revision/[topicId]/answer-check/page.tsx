"use client";

import { useParams } from "next/navigation";
import { Card } from "@/components/ui";
import { TopicRouteShell } from "@/components/revision/topic-route-shell";
import { TopicSupportResourcesCard } from "@/components/revision/topic-learning-modes";
import { WrittenAnswerChecker } from "@/components/revision/written-answer-checker";
import { getTopicPracticeBundle } from "@/lib/practice";
import { getTopicById } from "@/lib/types";

export default function TopicAnswerCheckPage() {
  const params = useParams();
  const topicId = typeof params.topicId === "string" ? params.topicId : "";
  const topicInfo = getTopicById(topicId);

  if (!topicInfo) {
    return null;
  }

  const bundle = getTopicPracticeBundle(topicId);

  return (
    <TopicRouteShell
      topicId={topicId}
      activeMode="answer-check"
      eyebrow="Structured answer check"
      title={`Check a ${topicInfo.label} answer`}
      description="This route is for formal written checking. It scores your answer against the rubric, shows matched and missing ideas, and points you to the best next revision action."
      aside={
        <>
          <TopicSupportResourcesCard
            title="Useful after checking"
            description="Use support material only after you see which ideas are still missing from your answer."
            resourceSteps={bundle.resourceSteps}
          />
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Output
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              You will get a rubric score, matched ideas, missing concepts, misconception flags, and a recommendation for what to improve next.
            </p>
          </Card>
        </>
      }
    >
      <WrittenAnswerChecker topicId={topicId} topicLabel={topicInfo.label} />
    </TopicRouteShell>
  );
}

