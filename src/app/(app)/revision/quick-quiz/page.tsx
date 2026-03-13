"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Target } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { RevisionSubnav } from "@/components/revision/revision-subnav";
import { QuickQuiz } from "@/components/revision/quick-quiz";
import { Badge, Card } from "@/components/ui";
import { getPracticePathSummary } from "@/lib/practice";

export default function QuickQuizPage() {
  const summary = getPracticePathSummary("mixed");

  return (
    <PageContainer size="lg">
      <div className="space-y-6">
        <RevisionSubnav activeRoute="quick-quiz" />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Quick quiz
            </p>
            <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
              Fast retrieval across the course
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Use this mode when you want a short burst of retrieval practice. It gives you a score,
              quick correction, and a clear next step without dropping you into a larger topic workspace.
            </p>
          </div>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-accent" />
              <h2 className="text-sm font-semibold text-foreground">What this route is for</h2>
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-border bg-surface/30 px-3 py-3 text-sm text-foreground">
                Quick retrieval and terminology checks
              </div>
              <div className="rounded-xl border border-border bg-surface/30 px-3 py-3 text-sm text-foreground">
                Fast score and correction
              </div>
              <div className="rounded-xl border border-border bg-surface/30 px-3 py-3 text-sm text-foreground">
                Easy transition into weak-topic review afterwards
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="accent">{summary.questionCount} questions in pool</Badge>
                <Badge variant="default">{summary.topicCount} topics</Badge>
              </div>
            </div>
          </Card>
        </div>

        <QuickQuiz />

        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/revision/weak-areas" className="group">
            <Card hover className="h-full p-5">
              <div className="flex items-center gap-2">
                <Target size={15} className="text-warning" />
                <p className="text-sm font-semibold text-foreground">After the quiz</p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Use the weak-areas route if you want the next best topic to revisit after a quick retrieval round.
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-accent">
                Open weak areas
                <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
              </div>
            </Card>
          </Link>

          <Link href="/revision/topics" className="group">
            <Card hover className="h-full p-5">
              <div className="flex items-center gap-2">
                <Target size={15} className="text-accent" />
                <p className="text-sm font-semibold text-foreground">Need one topic next?</p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Move into a topic route if the quiz shows one area still needs deeper recall, answer checking, or exam drilling.
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-accent">
                Open topic practice
                <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}

