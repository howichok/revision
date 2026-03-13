"use client";

import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { RevisionSubnav } from "@/components/revision/revision-subnav";
import { useAppData } from "@/components/providers/app-data-provider";
import { Badge, Card, ProgressBar } from "@/components/ui";
import { getRevisitQueue, getWeakestTopics } from "@/lib/progress";
import { getTopicById } from "@/lib/types";

export default function WeakAreasPage() {
  const { activityHistory, diagnostic, onboarding, revisionProgress } = useAppData();
  const revisitQueue = getRevisitQueue(
    diagnostic,
    onboarding,
    revisionProgress,
    activityHistory,
    6
  );
  const weakestTopics = getWeakestTopics(diagnostic, 6);

  return (
    <PageContainer size="lg">
      <div className="space-y-6">
        <RevisionSubnav activeRoute="weak-areas" />

        <Card variant="warning" className="p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Review and repeat
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
            Focus on the topics that still need work
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            This route is for targeted repetition. It ranks topics by diagnostic weakness, practice gaps,
            review coverage, and recency so you know exactly what to revisit next.
          </p>
        </Card>

        {revisitQueue.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {revisitQueue.map((item) => (
              <Card
                key={item.topicId}
                variant={
                  item.urgency === "due-now"
                    ? "danger"
                    : item.urgency === "revisit-soon"
                      ? "warning"
                      : "success"
                }
                className="h-full p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{item.topicIcon}</span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.topicLabel}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {item.urgency === "due-now"
                            ? "Due now"
                            : item.urgency === "revisit-soon"
                              ? "Revisit soon"
                              : "Keep warm"}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {item.nextAction}
                    </p>
                  </div>
                  <Badge
                    variant={
                      item.urgency === "due-now"
                        ? "danger"
                        : item.urgency === "revisit-soon"
                          ? "warning"
                          : "success"
                    }
                  >
                    {item.priority}
                  </Badge>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="surface-cutout rounded-xl px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      Practice
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">{item.practicePercent}%</p>
                  </div>
                  <div className="surface-cutout rounded-xl px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      Diagnostic
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {item.diagnosticPercent ?? "\u2014"}%
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {item.reasons.map((reason) => (
                    <div
                      key={`${item.topicId}-${reason}`}
                      className="surface-cutout rounded-xl px-3 py-2 text-xs text-muted-foreground"
                    >
                      {reason}
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link href={`/revision/${item.topicId}/practice`}>
                    <span className="inline-flex items-center gap-1 rounded-xl bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-soft">
                      Start practice
                      <ArrowRight size={14} />
                    </span>
                  </Link>
                  <Link href={`/revision/${item.topicId}/answer-check`}>
                    <span className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface/30 px-3 py-2 text-sm text-foreground transition-colors hover:border-accent/20 hover:bg-card">
                      Check an answer
                    </span>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : diagnostic ? (
          <Card variant="support" className="p-5">
            <p className="text-sm text-muted-foreground">
              No revisit queue has been generated yet. Start practice on any topic to build one.
            </p>
          </Card>
        ) : weakestTopics.length > 0 ? (
          <div className="space-y-4">
            {weakestTopics.map((topic) => {
              const pct = Math.round((topic.score / topic.maxScore) * 100);
              const topicInfo = getTopicById(topic.category);

              return (
                <Card key={topic.category} variant="warning" className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {topicInfo?.icon} {topic.topic}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        This is one of your lowest scored topics from the latest diagnostic.
                      </p>
                    </div>
                    <div className="min-w-[220px]">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Diagnostic score</span>
                        <span>{pct}%</span>
                      </div>
                      <ProgressBar value={pct} className="mt-3" size="sm" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card variant="support" className="p-5">
            <div className="flex items-center gap-2">
              <Target size={15} className="text-warning" />
              <p className="text-sm font-semibold text-foreground">No weak-area data yet</p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Run the diagnostic first so the system can tell you which topics need targeted review.
            </p>
            <div className="mt-4">
              <Link href="/revision/diagnostic">
                <span className="inline-flex items-center gap-1 rounded-xl bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-soft">
                  Start diagnostic
                  <ArrowRight size={14} />
                </span>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
