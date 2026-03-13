"use client";

import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  ClipboardCheck,
  Layers3,
  Sparkles,
  Target,
} from "lucide-react";
import { useAppData } from "@/components/providers/app-data-provider";
import { Badge, Button, Card } from "@/components/ui";
import {
  getFilteredQuickQuizQuestionPool,
  getPracticePathSummary,
  getTopicPracticeBundle,
} from "@/lib/practice";
import {
  getRevisitQueue,
  getWeakestTopics,
} from "@/lib/progress";
import { TOPICS, getTopicById } from "@/lib/types";

interface PracticeHubProps {
  onOpenDiagnostic?: () => void;
  compact?: boolean;
}

function PracticePathCard({
  href,
  eyebrow,
  title,
  description,
  count,
  statLabel,
  emphasis,
}: {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  count: number;
  statLabel: string;
  emphasis?: "accent" | "warning" | "default";
}) {
  return (
    <Link href={href} className="group">
      <Card
        hover
        className={`h-full overflow-hidden ${
          emphasis === "accent"
            ? "border-accent/20 bg-[linear-gradient(145deg,rgba(139,92,246,0.16),rgba(17,17,19,0.96)_42%,rgba(17,17,19,1))]"
            : emphasis === "warning"
              ? "border-warning/20 bg-[linear-gradient(145deg,rgba(245,158,11,0.12),rgba(17,17,19,0.96)_42%,rgba(17,17,19,1))]"
              : ""
        }`}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </p>
        <h3 className="mt-3 text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        <div className="mt-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-bold text-foreground">{count}</p>
            <p className="text-xs text-muted-foreground">{statLabel}</p>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-accent">
            Open route
            <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function PracticeHub({ onOpenDiagnostic, compact = false }: PracticeHubProps) {
  const { activityHistory, diagnostic, onboarding, revisionProgress } = useAppData();
  const mixedSummary = getPracticePathSummary("mixed");
  const paperOneSummary = getPracticePathSummary("paper-1");
  const paperTwoSummary = getPracticePathSummary("paper-2");
  const revisitQueue = getRevisitQueue(
    diagnostic,
    onboarding,
    revisionProgress,
    activityHistory,
    compact ? 2 : 3
  );
  const weakestTopics = getWeakestTopics(diagnostic, compact ? 2 : 3);
  const topicCards = TOPICS.filter((topic) => topic.id !== "esp").map((topic) => ({
    ...topic,
    questionCount: getFilteredQuickQuizQuestionPool({ topicId: topic.id }).length,
    examDrillCount: getTopicPracticeBundle(topic.id).examDrills.length,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Practice routes
          </p>
          <h2 className="mt-1 text-2xl font-bold text-foreground">
            Choose how you want to revise
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Use mixed retrieval for broad recall, go straight into Paper 1 or Paper 2 structure,
            open one topic workspace, or repeat the areas your data says are still weak.
          </p>
        </div>
        {onOpenDiagnostic && (
          <Button variant="outline" onClick={onOpenDiagnostic}>
            <BrainCircuit size={14} />
            Open adaptive diagnostic
          </Button>
        )}
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-accent" />
          <div>
            <p className="text-sm font-semibold text-foreground">Start Here</p>
            <p className="text-xs text-muted-foreground">
              Quick entry points when you want the next best study path immediately.
            </p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <PracticePathCard
            href="/revision/quick-quiz"
            eyebrow={mixedSummary.eyebrow}
            title={mixedSummary.title}
            description={mixedSummary.description}
            count={mixedSummary.questionCount}
            statLabel={mixedSummary.statLabel}
            emphasis="accent"
          />

          <Card className="h-full">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Adaptive / personalised
                </p>
                <h3 className="mt-3 text-lg font-semibold text-foreground">
                  Start from what you can already explain
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Use the diagnostic when you want the system to map freeform answers, ask follow-ups,
                  and turn that into weak-point coverage.
                </p>
              </div>
              <ClipboardCheck size={18} className="text-accent" />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge variant="accent">Freeform first</Badge>
              <Badge variant="default">Follow-up questions</Badge>
              <Badge variant="warning">Weak-point map</Badge>
            </div>
            {onOpenDiagnostic ? (
              <div className="mt-5">
                <Button onClick={onOpenDiagnostic}>
                  Open diagnostic
                  <ArrowRight size={14} />
                </Button>
              </div>
            ) : (
              <div className="mt-5">
                <Link
                  href="/revision/diagnostic"
                  className="inline-flex items-center gap-1 text-xs font-medium text-accent"
                >
                  Open diagnostic route
                  <ArrowRight size={12} />
                </Link>
              </div>
            )}
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Layers3 size={15} className="text-warning" />
          <div>
            <p className="text-sm font-semibold text-foreground">Practice by Paper</p>
            <p className="text-xs text-muted-foreground">
              Follow the real exam structure instead of guessing which mode to use.
            </p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <PracticePathCard
            href="/revision/paper-1"
            eyebrow={paperOneSummary.eyebrow}
            title={paperOneSummary.title}
            description={paperOneSummary.description}
            count={paperOneSummary.questionCount}
            statLabel={paperOneSummary.statLabel}
          />
          <PracticePathCard
            href="/revision/paper-2"
            eyebrow={paperTwoSummary.eyebrow}
            title={paperTwoSummary.title}
            description={paperTwoSummary.description}
            count={paperTwoSummary.questionCount}
            statLabel={paperTwoSummary.statLabel}
            emphasis="warning"
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Target size={15} className="text-accent" />
          <div>
            <p className="text-sm font-semibold text-foreground">Practice by Topic</p>
            <p className="text-xs text-muted-foreground">
              Open one topic route for overview, recall, exam drills, written answers, quizzes, and resources.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Link href="/revision/topics" className="group">
            <Card hover className="h-full border-accent/20 bg-accent/10">
              <div className="flex h-full flex-col justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                    Topic directory
                  </p>
                  <p className="mt-3 text-base font-semibold text-foreground">
                    Browse all topic routes
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Start from the full topic list if you already know what area you want to revise.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-accent">
                  Open topics
                  <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Card>
          </Link>
          {topicCards.map((topic) => (
            <Link
              key={topic.id}
              href={`/revision/${topic.id}/practice`}
              className="group"
            >
              <Card hover className="h-full">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{topic.icon}</span>
                      <p className="text-sm font-semibold text-foreground">{topic.label}</p>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                      {topic.questionCount} quiz questions and {topic.examDrillCount} guided exam prompts.
                    </p>
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-muted-foreground transition-colors group-hover:text-accent"
                  />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Target size={15} className="text-success" />
          <div>
            <p className="text-sm font-semibold text-foreground">Review & Repeat</p>
            <p className="text-xs text-muted-foreground">
              Repeat the areas that are actually weak instead of restarting everything.
            </p>
          </div>
        </div>

        {revisitQueue.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-3">
            {revisitQueue.map((item) => (
              <Link
                key={item.topicId}
                href={`/revision/${item.topicId}/practice`}
                className="group"
              >
                <Card hover className="h-full">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{item.topicIcon}</span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {item.topicLabel}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {item.urgency === "due-now"
                              ? "Due now"
                              : item.urgency === "revisit-soon"
                                ? "Revisit soon"
                                : "Keep warm"}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
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
                </Card>
              </Link>
            ))}
          </div>
        ) : weakestTopics.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-3">
            {weakestTopics.map((topic) => {
              const topicInfo = getTopicById(topic.category);
              const pct = Math.round((topic.score / topic.maxScore) * 100);

              return (
                <Link
                  key={topic.category}
                  href={`/revision/${topic.category}/practice`}
                  className="group"
                >
                  <Card hover className="h-full">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{topicInfo?.icon}</span>
                          <p className="text-sm font-semibold text-foreground">
                            {topic.topic}
                          </p>
                        </div>
                        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                          Rebuild this weaker area with topic practice before moving on.
                        </p>
                      </div>
                      <Badge variant={pct >= 50 ? "warning" : "danger"}>{pct}%</Badge>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card>
            <p className="text-sm text-muted-foreground">
              Run the diagnostic to unlock weak-topic review and revisit recommendations.
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}
