"use client";

import { useParams } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { WrittenAnswerChecker } from "@/components/revision/written-answer-checker";
import { getTopicById } from "@/lib/types";

export default function TopicAnswerCheckPage() {
  const params = useParams();
  const topicId = typeof params.topicId === "string" ? params.topicId : "";
  const topicInfo = getTopicById(topicId);

  if (!topicInfo) {
    return null;
  }

  return (
    <PageContainer size="lg">
      <WrittenAnswerChecker
        topicId={topicId}
        topicLabel={topicInfo.label}
        topicIcon={topicInfo.icon}
      />
    </PageContainer>
  );
}
