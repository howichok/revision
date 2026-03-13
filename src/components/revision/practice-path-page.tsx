"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, BookOpen, Layers3, Target } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { RevisionSubnav } from "@/components/revision/revision-subnav";
import { Badge, Button, Card } from "@/components/ui";
import {
  getPaperPracticeBundle,
  getPracticePathSummary,
  type PracticePathId,
} from "@/lib/practice";
import { TOPICS } from "@/lib/types";
import { QuickQuiz } from "./quick-quiz";

interface PracticePathPageProps {
  pathId: PracticePathId;
}

export function PracticePathPage({ pathId }: PracticePathPageProps) {
  const [quizStarted, setQuizStarted] = useState(false);
  const summary = getPracticePathSummary(pathId);
  const paperBundle =
    pathId === "mixed" ? null : getPaperPracticeBundle(pathId);
  const relatedTopics = useMemo(
    () =>
      summary.relatedTopicIds
        .map((topicId) => TOPICS.find((topic) => topic.id === topicId))
        .filter((topic): topic is (typeof TOPICS)[number] => Boolean(topic))
        .slice(0, 6),
    [summary.relatedTopicIds]
  );

  return (
    <PageContainer size="lg">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-6"
      >
        <RevisionSubnav activeRoute={pathId === "mixed" ? "quick-quiz" : pathId} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {summary.eyebrow}
              </p>
              {summary.paper && <Badge variant="accent">{summary.paper}</Badge>}
            </div>
            <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
              {summary.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {summary.description}
            </p>
          </div>
          <Link href="/revision">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={14} />
              Back to revision
            </Button>
          </Link>
        </div>

        {!quizStarted ? (
          <>
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <Card className="overflow-hidden">
                <div className="rounded-[28px] border border-accent/20 bg-[linear-gradient(145deg,rgba(139,92,246,0.16),rgba(17,17,19,0.95)_42%,rgba(17,17,19,1))] p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
                        <Layers3 size={12} />
                        {summary.title}
                      </div>
                      <h2 className="text-2xl font-semibold text-foreground">
                        {summary.purpose}
                      </h2>
                      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                        {pathId === "mixed"
                          ? "Use this when you want a broad warm-up before you narrow down into a topic or paper."
                          : summary.paper === "Paper 1"
                            ? "This route keeps the focus on theory, terminology, definitions, and shorter retrieval-style questions."
                            : "This route keeps the focus on applied scenario questions, explanation, and exam-style written answers."}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:max-w-[220px] sm:justify-end">
                      <Badge variant="accent">{summary.questionCount} questions</Badge>
                      <Badge variant="default">{summary.topicCount} topics</Badge>
                      <Badge variant="warning">{summary.examDrillCount} drills mapped</Badge>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <Button onClick={() => setQuizStarted(true)}>
                      {summary.startLabel}
                      <ArrowRight size={14} />
                    </Button>
                    <Link href="/revision">
                      <Button variant="outline">Open practice hub</Button>
                    </Link>
                  </div>
                </div>
              </Card>

              <Card className="space-y-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Included topics
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {relatedTopics.map((topic) => (
                      <span
                        key={topic.id}
                        className="rounded-xl border border-border bg-surface/30 px-3 py-2 text-xs text-foreground"
                      >
                        {topic.icon} {topic.label}
                      </span>
                    ))}
                  </div>
                </div>

                {paperBundle && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Question style
                    </p>
                    <div className="mt-3 space-y-2">
                      {paperBundle.quizQuestions.slice(0, 3).map((question) => (
                        <div
                          key={question.id}
                          className="rounded-xl border border-border bg-surface/30 px-3 py-3"
                        >
                          <p className="text-sm font-medium text-foreground">{question.question}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {question.sourceLabel ?? question.paper ?? "Practice route"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Next after this
                  </p>
                  <div className="mt-3 space-y-2">
                    <Link
                      href="/revision/quick-quiz"
                      className="flex items-center justify-between rounded-xl border border-border bg-surface/30 px-3 py-3 text-sm text-foreground transition-colors hover:border-accent/20 hover:bg-card"
                    >
                      <span>Quick quiz</span>
                      <ArrowRight size={14} className="text-accent" />
                    </Link>
                    <Link
                      href="/revision/paper-1"
                      className="flex items-center justify-between rounded-xl border border-border bg-surface/30 px-3 py-3 text-sm text-foreground transition-colors hover:border-accent/20 hover:bg-card"
                    >
                      <span>Paper 1 practice</span>
                      <ArrowRight size={14} className="text-accent" />
                    </Link>
                    <Link
                      href="/revision/paper-2"
                      className="flex items-center justify-between rounded-xl border border-border bg-surface/30 px-3 py-3 text-sm text-foreground transition-colors hover:border-accent/20 hover:bg-card"
                    >
                      <span>Paper 2 practice</span>
                      <ArrowRight size={14} className="text-accent" />
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Active route
                </p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">
                  {summary.title}
                </h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setQuizStarted(false)}>
                Exit route
              </Button>
            </div>

            <QuickQuiz
              autoStart
              paperId={pathId === "mixed" ? undefined : pathId}
            />

            <Card className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div>
                <div className="flex items-center gap-2">
                  <Target size={14} className="text-accent" />
                  <p className="text-sm font-semibold text-foreground">Topic practice</p>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Want to stay in one area after this route? Open a topic workspace and continue with recall, exam drills, and written answers.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen size={14} className="text-warning" />
                  <p className="text-sm font-semibold text-foreground">Related routes</p>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link
                    href="/revision/paper-1"
                    className="rounded-lg border border-border bg-surface/30 px-3 py-2 text-xs text-foreground"
                  >
                    Paper 1
                  </Link>
                  <Link
                    href="/revision/paper-2"
                    className="rounded-lg border border-border bg-surface/30 px-3 py-2 text-xs text-foreground"
                  >
                    Paper 2
                  </Link>
                  <Link
                    href="/revision/quick-quiz"
                    className="rounded-lg border border-border bg-surface/30 px-3 py-2 text-xs text-foreground"
                  >
                    Quick Quiz
                  </Link>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Included topics</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {relatedTopics.length > 0
                    ? `${relatedTopics.map((topic) => topic.label).join(", ")}.`
                    : "This route pulls from the broader revision pool."}
                </p>
              </div>
            </Card>
          </div>
        )}
      </motion.div>
    </PageContainer>
  );
}
