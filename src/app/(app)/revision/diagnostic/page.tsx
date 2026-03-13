"use client";

import { PageContainer } from "@/components/layout/page-container";
import { DiagnosticWorkspace } from "@/components/revision/diagnostic-workspace";
import { useAppData } from "@/components/providers/app-data-provider";
import type { DiagnosticResult } from "@/lib/types";

export default function DiagnosticPage() {
  const { diagnostic, saveDiagnosticResult } = useAppData();

  async function handleComplete(result: DiagnosticResult) {
    await saveDiagnosticResult(result);
  }

  return (
    <PageContainer size="lg" className="max-w-[88rem]">
      <DiagnosticWorkspace diagnostic={diagnostic} onComplete={handleComplete} />
    </PageContainer>
  );
}
