"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { QuickQuiz, type QuickQuizStage } from "@/components/revision/quick-quiz";
import { RevisionSubnav } from "@/components/revision/revision-subnav";

export default function QuickQuizPage() {
  const [stage, setStage] = useState<QuickQuizStage>("launcher");

  return (
    <PageContainer size="lg">
      <div className={stage === "launcher" ? "space-y-6" : undefined}>
        {stage === "launcher" ? <RevisionSubnav activeRoute="quick-quiz" /> : null}
        <QuickQuiz onStageChange={setStage} />
      </div>
    </PageContainer>
  );
}
