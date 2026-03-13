"use client";

import { useParams } from "next/navigation";
import { Card } from "@/components/ui";
import { TopicRouteShell } from "@/components/revision/topic-route-shell";
import { TopicSupportResourcesCard } from "@/components/revision/topic-learning-modes";
import { QuickQuiz } from "@/components/revision/quick-quiz";
import { getTopicPracticeBundle } from "@/lib/practice";
import { getTopicById } from "@/lib/types";

export default function TopicQuizPage() {
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
      activeMode="quiz"
      eyebrow="Topic quick quiz"
      title={`${topicInfo.label} quick quiz`}
      description="Use this route for fast retrieval questions inside one topic. It gives you quick correction, a score, and a clear next step without mixing in other practice modes."
      aside={
        <>
          <TopicSupportResourcesCard
            title="Support material"
            description="Use topic resources after the quiz tells you what still feels shaky."
            resourceSteps={bundle.resourceSteps}
          />
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Outcome
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              This route ends with a score and a simple recommendation: retry, move into weak-topic practice, or open another topic mode.
            </p>
          </Card>
        </>
      }
    >
      <QuickQuiz topicId={topicId} />
    </TopicRouteShell>
  );
}

