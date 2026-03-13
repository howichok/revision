"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, BrainCircuit, ClipboardList, FileQuestion, Sparkles, Target } from "lucide-react";
import { Badge, Card, ProgressBar } from "@/components/ui";
import { getPracticeSetId, getTopicPracticeBundle } from "@/lib/practice";
import { getPracticeSetProgress } from "@/lib/progress";
import { useAppData } from "@/components/providers/app-data-provider";

interface TopicPracticeStudioProps {
  topicId: string;
  topicLabel: string;
}

export function TopicPracticeStudio({
  topicId,
  topicLabel,
}: TopicPracticeStudioProps) {
  const { revisionProgress } = useAppData();
  const bundle = getTopicPracticeBundle(topicId);
  const recallProgress =
    getPracticeSetProgress(revisionProgress, topicId, getPracticeSetId(topicId, "recall"))
      ?.progressPercent ?? 0;
  const examProgress =
    getPracticeSetProgress(revisionProgress, topicId, getPracticeSetId(topicId, "exam-drill"))
      ?.progressPercent ?? 0;
  const quizProgress =
    getPracticeSetProgress(revisionProgress, topicId, getPracticeSetId(topicId, "quiz"))
      ?.progressPercent ?? 0;

  const modeCards = [
    {
      href: `/revision/${topicId}/recall`,
      title: "Active Recall",
      description: "Recall terms and curriculum points before you reveal the answer.",
      countLabel: `${bundle.recallCards.length} cards`,
      progress: recallProgress,
      icon: BrainCircuit,
      tone: "accent" as const,
    },
    {
      href: `/revision/${topicId}/exam-drill`,
      title: "Guided Exam Practice",
      description: "Plan the answer, then compare it with the mark-scheme checklist.",
      countLabel: `${bundle.examDrills.length} prompts`,
      progress: examProgress,
      icon: ClipboardList,
      tone: "warning" as const,
    },
    {
      href: `/revision/${topicId}/answer-check`,
      title: "Answer Checker",
      description: "Write one answer and check it against the rubric with matched and missing ideas.",
      countLabel: "Structured feedback",
      progress: null,
      icon: Sparkles,
      tone: "success" as const,
    },
    {
      href: `/revision/${topicId}/quiz`,
      title: "Quick Quiz",
      description: "Fast retrieval questions for terminology, subtopics, and exam wording.",
      countLabel: `${bundle.quizQuestions.length} questions`,
      progress: quizProgress,
      icon: Target,
      tone: "accent" as const,
    },
    {
      href: `/revision/${topicId}/exam-questions`,
      title: "Exam Questions",
      description: "Review mapped past-paper prompts, marks, and answer focus for this topic.",
      countLabel: `${bundle.examDrills.length} mapped questions`,
      progress: null,
      icon: FileQuestion,
      tone: "default" as const,
    },
    {
      href: `/revision/${topicId}/resources`,
      title: "Resources",
      description: "Use topic-specific notes, papers, and mark schemes when you need support material.",
      countLabel: `${bundle.resourceSteps.filter((step) => step.resource).length} guided resources`,
      progress: null,
      icon: BookOpen,
      tone: "default" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Topic practice
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">
              Choose one revision mode for {topicLabel}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Stay focused on one task at a time. Pick the mode that matches what you need right now:
              recall, guided planning, answer checking, fast quiz practice, or support material.
            </p>
          </div>
          <Badge variant="accent">
            {Math.round((recallProgress + examProgress + quizProgress) / 3)}% saved practice
          </Badge>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modeCards.map((mode) => {
          const Icon = mode.icon;

          return (
            <Link key={mode.href} href={mode.href} className="group">
              <Card hover className="h-full p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-card">
                        <Icon
                          size={18}
                          className={
                            mode.tone === "warning"
                              ? "text-warning"
                              : mode.tone === "success"
                                ? "text-success"
                                : mode.tone === "accent"
                                  ? "text-accent"
                                  : "text-muted-foreground"
                          }
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{mode.title}</p>
                        <p className="text-xs text-muted-foreground">{mode.countLabel}</p>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {mode.description}
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground transition-colors group-hover:text-accent" />
                </div>

                {typeof mode.progress === "number" && (
                  <div className="mt-5 rounded-2xl border border-border bg-surface/30 px-4 py-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Saved progress</span>
                      <span>{mode.progress}%</span>
                    </div>
                    <ProgressBar value={mode.progress} size="sm" className="mt-3" />
                  </div>
                )}
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

