"use client";

import { PageContainer } from "@/components/layout/page-container";
import { RevisionSubnav } from "@/components/revision/revision-subnav";
import { DiagnosticWorkspace } from "@/components/revision/diagnostic-workspace";
import { useAppData } from "@/components/providers/app-data-provider";
import type { DiagnosticResult } from "@/lib/types";

export default function DiagnosticPage() {
  const { diagnostic, saveDiagnosticResult } = useAppData();

  async function handleComplete(result: DiagnosticResult) {
    await saveDiagnosticResult(result);
  }

  return (
    <PageContainer size="lg">
      <div className="space-y-6">
        <RevisionSubnav activeRoute="diagnostic" />

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Revision diagnostic
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
            Diagnose one topic at a time
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            This route is only for diagnosis. You will choose one topic, explain what you know,
            answer targeted follow-up checks, then finish with a clear saved result and next revision step.
          </p>
        </div>

        <DiagnosticWorkspace diagnostic={diagnostic} onComplete={handleComplete} />
      </div>
    </PageContainer>
  );
}

