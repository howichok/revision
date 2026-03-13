"use client";

import Link from "next/link";
import { ArrowRight, BrainCircuit, Clock, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { PageContainer } from "@/components/layout/page-container";
import { RevisionSubnav } from "@/components/revision/revision-subnav";
import { PracticeHub } from "@/components/revision/practice-hub";
import { useAppData } from "@/components/providers/app-data-provider";
import { Badge, Button, Card, ProgressBar } from "@/components/ui";
import { formatRelativeTime, getWeakestTopics } from "@/lib/progress";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
};

export default function RevisionPage() {
  const { activityHistory, diagnostic } = useAppData();
  const weakestTopics = getWeakestTopics(diagnostic, 3);
  const latestStructuredReport =
    diagnostic?.topicDiagnostics?.find((report) => report.topicId === diagnostic.latestTopicId) ??
    diagnostic?.topicDiagnostics?.[0] ??
    null;

  return (
    <PageContainer size="lg">
      <motion.div initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={fadeUp} custom={0} className="space-y-4">
          <RevisionSubnav activeRoute="hub" />

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Revision hub
              </p>
              <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
                Choose one clear revision path
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                This page is now only for route choice and orientation. Start a diagnostic, open a paper route,
                choose a topic, run a quick quiz, review weak areas, or inspect progress without mixing all of those modes on one screen.
              </p>
            </div>

            <Card className="p-5">
              <div className="flex items-center gap-2">
                <BrainCircuit size={15} className="text-accent" />
                <h2 className="text-sm font-semibold text-foreground">Latest snapshot</h2>
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-border bg-surface/30 px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Overall score
                  </p>
                  <p className="mt-2 text-2xl font-bold text-foreground">
                    {diagnostic?.overallScore ?? "\u2014"}{diagnostic ? "%" : ""}
                  </p>
                </div>
                {latestStructuredReport ? (
                  <div className="rounded-xl border border-border bg-surface/30 px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Latest diagnostic topic
                    </p>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      {latestStructuredReport.topicLabel}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {latestStructuredReport.suggestedNextTargets[0] ?? "Ready for targeted practice."}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-surface/30 px-3 py-3">
                    <p className="text-sm text-muted-foreground">
                      No structured diagnostic has been saved yet.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} custom={1}>
          <PracticeHub />
        </motion.div>

        <motion.div variants={fadeUp} custom={2} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className="text-warning" />
              <h2 className="text-sm font-semibold text-foreground">Weakest scored topics</h2>
            </div>
            <div className="mt-4 space-y-3">
              {weakestTopics.length > 0 ? (
                weakestTopics.map((topic) => {
                  const pct = Math.round((topic.score / topic.maxScore) * 100);

                  return (
                    <div
                      key={topic.category}
                      className="rounded-xl border border-border bg-surface/30 px-4 py-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-foreground">{topic.topic}</p>
                        <Badge variant={pct >= 50 ? "warning" : "danger"}>{pct}%</Badge>
                      </div>
                      <ProgressBar value={pct} className="mt-3" size="sm" />
                      <div className="mt-4">
                        <Link href={`/revision/${topic.category}/practice`}>
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
                            Open topic practice
                            <ArrowRight size={12} />
                          </span>
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-border bg-surface/30 px-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    Run the diagnostic first to see which topics are weakest.
                  </p>
                  <div className="mt-4">
                    <Link href="/revision/diagnostic">
                      <Button>
                        Start diagnostic
                        <ArrowRight size={14} />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>
            </div>
            <div className="mt-4 space-y-2">
              {activityHistory.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-border bg-surface/30 px-3 py-3"
                >
                  <p className="text-sm text-foreground">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatRelativeTime(item.occurredAt)}
                  </p>
                </div>
              ))}
              {activityHistory.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No recent revision activity yet.
                </p>
              )}
            </div>
            <div className="mt-4">
              <Link href="/revision/progress">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
                  Open full progress summary
                  <ArrowRight size={12} />
                </span>
              </Link>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
