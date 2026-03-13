"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button, Card, Badge, ProgressBar } from "@/components/ui";
import { RevisionSubnav } from "@/components/revision/revision-subnav";
import { getTopicRouteItems, type TopicLearningMode } from "@/lib/revision-routes";
import { getTopicById } from "@/lib/types";
import { useAppData } from "@/components/providers/app-data-provider";
import { getSubtopicProgressForTopic } from "@/lib/progress";
import { cn } from "@/lib/utils";

interface TopicRouteShellProps {
  topicId: string;
  activeMode: TopicLearningMode;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}

const modeToneMap: Record<
  TopicLearningMode,
  { shellVariant: "navigation" | "accent" | "warning" | "support" | "success"; badgeVariant: "accent" | "warning" | "default" | "success" }
> = {
  overview: { shellVariant: "navigation", badgeVariant: "default" },
  practice: { shellVariant: "accent", badgeVariant: "accent" },
  recall: { shellVariant: "accent", badgeVariant: "accent" },
  "exam-drill": { shellVariant: "warning", badgeVariant: "warning" },
  "answer-check": { shellVariant: "success", badgeVariant: "success" },
  quiz: { shellVariant: "accent", badgeVariant: "accent" },
  "exam-questions": { shellVariant: "warning", badgeVariant: "warning" },
  resources: { shellVariant: "support", badgeVariant: "default" },
  progress: { shellVariant: "support", badgeVariant: "success" },
};

function getScoreVariant(pct: number): "success" | "warning" | "danger" {
  if (pct >= 75) return "success";
  if (pct >= 50) return "warning";
  return "danger";
}

export function TopicRouteShell({
  topicId,
  activeMode,
  eyebrow,
  title,
  description,
  children,
  aside,
}: TopicRouteShellProps) {
  const pathname = usePathname();
  const { diagnostic, revisionProgress } = useAppData();
  const topicInfo = getTopicById(topicId);

  if (!topicInfo) {
    return null;
  }

  const topicScore = diagnostic?.topicScores.find((score) => score.category === topicId);
  const scorePercent = topicScore
    ? Math.round((topicScore.score / topicScore.maxScore) * 100)
    : null;
  const progress = getSubtopicProgressForTopic(revisionProgress, topicId);
  const topicRoutes = getTopicRouteItems(topicId);
  const tone = modeToneMap[activeMode];

  return (
    <div className="space-y-6">
      <RevisionSubnav activeRoute="topics" />

      <Card variant={tone.shellVariant} className="space-y-4 rounded-[28px] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Link href="/revision/topics" className="inline-flex">
              <Button variant="ghost" size="sm">
                <ArrowLeft size={14} />
                Back to topics
              </Button>
            </Link>
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-2xl">
                {topicInfo.icon}
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {eyebrow}
                </p>
                <div className="mt-2">
                  <Badge variant={tone.badgeVariant}>{activeMode.replace("-", " ")}</Badge>
                </div>
                <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
                  {title}
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Card variant="support" className="min-w-[180px] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Diagnostic score
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-2xl font-bold text-foreground">
                  {scorePercent ?? "\u2014"}{scorePercent !== null ? "%" : ""}
                </span>
                {scorePercent !== null && (
                  <Badge variant={getScoreVariant(scorePercent)}>{scorePercent}%</Badge>
                )}
              </div>
            </Card>

            <Card variant="support" className="min-w-[180px] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Topic progress
              </p>
              <div className="mt-3 flex items-center justify-between gap-3 text-sm text-foreground">
                <span>{progress.completed}/{progress.totalSubtopics || 0} reviewed</span>
                <span className="font-semibold">{progress.progressPercent}%</span>
              </div>
              <ProgressBar value={progress.progressPercent} className="mt-3" size="sm" />
            </Card>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="flex min-w-max gap-2 rounded-2xl border border-white/8 bg-black/20 p-2">
            {topicRoutes.map((item) => {
              const isActive = item.id === activeMode || pathname === item.href;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm transition-colors",
                    isActive
                      ? tone.badgeVariant === "warning"
                        ? "bg-warning/15 text-warning"
                        : tone.badgeVariant === "success"
                          ? "bg-success/15 text-success"
                          : "bg-accent/10 text-accent"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <span className="block font-medium">{item.label}</span>
                  <span className="mt-0.5 block text-[11px] opacity-70">
                    {item.description}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </Card>

      {aside ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div>{children}</div>
          <div className="space-y-4">{aside}</div>
        </div>
      ) : (
        <div>{children}</div>
      )}
    </div>
  );
}
