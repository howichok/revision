"use client";

import { useParams } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { QuickQuiz } from "@/components/revision/quick-quiz";
import { getTopicById } from "@/lib/types";

export default function TopicQuizPage() {
  const params = useParams();
  const topicId = typeof params.topicId === "string" ? params.topicId : "";
  const topicInfo = getTopicById(topicId);

  if (!topicInfo) {
    return null;
  }

  return (
    <PageContainer size="lg" className="max-w-[88rem]">
      <QuickQuiz topicId={topicId} />
    </PageContainer>
  );
}
