"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  ClipboardList,
  FileQuestion,
  Key,
  LayoutList,
  Target,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { useAppData } from "@/components/providers/app-data-provider";
import { WrittenAnswerChecker } from "@/components/revision/written-answer-checker";
import { Button, Card, CardContent, ProgressBar, Badge } from "@/components/ui";
import { PageContainer } from "@/components/layout/page-container";
import { getMarkSchemeConceptsForQuestion, getTopicContentBundle } from "@/lib/content";
import { getSubtopicProgressForTopic } from "@/lib/progress";
import { getTopicById, getTopicTree } from "@/lib/types";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutList },
  { id: "subtopics", label: "Subtopics", icon: BookOpen },
  { id: "key-terms", label: "Key Terms", icon: Key },
  { id: "practice", label: "Practice", icon: ClipboardList },
  { id: "exam-questions", label: "Exam Questions", icon: FileQuestion },
  { id: "weak-areas", label: "Weak Areas", icon: Target },
  { id: "progress", label: "Progress", icon: TrendingUp },
] as const;

type TabId = (typeof TABS)[number]["id"];

function getScoreVariant(pct: number): "success" | "warning" | "danger" {
  if (pct >= 75) return "success";
  if (pct >= 50) return "warning";
  return "danger";
}

export default function TopicPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = typeof params.topicId === "string" ? params.topicId : "";
  const { diagnostic, onboarding, revisionProgress, toggleSubtopicReview } = useAppData();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [pendingSubtopicId, setPendingSubtopicId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const topicInfo = getTopicById(topicId);
  const tree = getTopicTree(topicId);
  const topicContent = getTopicContentBundle(topicId);
  const topicScore = diagnostic?.topicScores.find((score) => score.category === topicId);
  const pct = topicScore ? Math.round((topicScore.score / topicScore.maxScore) * 100) : 0;
  const reviewedIds = new Set(
    revisionProgress
      .filter(
        (entry) =>
          entry.topicId === topicId &&
          entry.entityType === "subtopic" &&
          entry.status === "completed"
      )
      .map((entry) => entry.entityId)
  );
  const focusedSubtopics =
    onboarding?.focusBreakdown?.selectedSubtopics[topicId]?.length
      ? tree?.subtopics.filter((subtopic) =>
          onboarding.focusBreakdown?.selectedSubtopics[topicId]?.includes(subtopic.id)
        ) ?? []
      : tree?.subtopics ?? [];
  const topicProgress = getSubtopicProgressForTopic(revisionProgress, topicId);
  const allKeywords = Array.from(
    new Set([
      ...(tree?.subtopics.flatMap((subtopic) => subtopic.keywords) ?? []),
      ...topicContent.terms.map((term) => term.term),
    ])
  );

  if (!topicInfo || !tree) {
    return (
      <PageContainer>
        <div className="py-20 text-center">
          <p className="text-muted-foreground mb-4">Topic not found.</p>
          <Button variant="outline" onClick={() => router.push("/revision")}>
            <ArrowLeft size={14} /> Back to Revision
          </Button>
        </div>
      </PageContainer>
    );
  }

  async function handleToggleReview(subtopicId: string, subtopicLabel: string) {
    const completed = !reviewedIds.has(subtopicId);
    setPendingSubtopicId(subtopicId);

    try {
      setError("");
      await toggleSubtopicReview({
        topicId,
        subtopicId,
        subtopicLabel,
        completed,
      });
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Unable to update revision progress."
      );
    } finally {
      setPendingSubtopicId(null);
    }
  }

  return (
    <PageContainer className="max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/revision")}>
              <ArrowLeft size={16} />
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{topicInfo.icon}</span>
              <div>
                <h1 className="text-xl font-bold text-foreground">{topicInfo.label}</h1>
                <p className="text-xs text-muted-foreground">Topic workspace</p>
              </div>
            </div>
          </div>
          {diagnostic && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Diagnostic score</span>
              <Badge variant={getScoreVariant(pct)} className="text-sm">
                {pct}%
              </Badge>
              <ProgressBar value={pct} className="w-24" size="sm" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1 border-b border-border pb-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors",
                  isActive
                    ? "bg-card border border-border border-b-0 -mb-px text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface/50"
                )}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <Card>
          <CardContent className="p-6 min-h-[320px]">
            {error && (
              <div className="mb-4 flex items-center gap-2 text-sm text-danger bg-danger/10 rounded-lg px-3 py-2.5">
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </div>
            )}

            {activeTab === "overview" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{tree.description}</p>

                <div className="p-4 rounded-xl bg-surface/40 border border-border">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        Revision progress
                      </p>
                      <p className="text-sm text-foreground">
                        {topicProgress.completed} of {topicProgress.totalSubtopics} subtopics reviewed
                      </p>
                    </div>
                    <Badge variant={topicProgress.progressPercent >= 50 ? "success" : "accent"}>
                      {topicProgress.progressPercent}%
                    </Badge>
                  </div>
                  <ProgressBar value={topicProgress.progressPercent} className="mt-3" />
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Subtopics in this topic
                  </h3>
                  <ul className="space-y-1">
                    {tree.subtopics.map((subtopic) => (
                      <li key={subtopic.id} className="text-sm text-foreground flex items-center gap-2">
                        <span className="text-muted-foreground font-mono text-xs">{subtopic.id}</span>
                        {subtopic.label}
                      </li>
                    ))}
                  </ul>
                </div>

                {topicContent.mapping && (
                  <div className="rounded-xl border border-accent/15 bg-accent/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent mb-2">
                      Official DSD 2025 Coverage
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                      {topicContent.mapping.note}
                    </p>
                    <div className="space-y-2.5">
                      {topicContent.officialPoints.map((point) => (
                        <div
                          key={point.id}
                          className="rounded-xl border border-border bg-card/70 px-4 py-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold text-accent">{point.code}</p>
                              <p className="text-sm font-medium text-foreground mt-1">{point.title}</p>
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                {point.summary}
                              </p>
                            </div>
                            <Badge variant="accent">Official</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {topicContent.resources.length > 0 && (
                  <div className="rounded-xl border border-border bg-surface/30 p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.18em] mb-3">
                      Linked Materials
                    </p>
                    <div className="space-y-2">
                      {topicContent.resources.slice(0, 4).map((resource) => (
                        <div
                          key={resource.id}
                          className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card/60 px-3 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">{resource.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{resource.summary}</p>
                          </div>
                          <Badge
                            variant={
                              resource.kind === "past-paper"
                                ? "accent"
                                : resource.kind === "mark-scheme"
                                  ? "warning"
                                  : "default"
                            }
                          >
                            {resource.kind.replace("-", " ")}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "subtopics" && (
              <div className="space-y-3">
                {tree.subtopics.map((subtopic) => (
                  <div
                    key={subtopic.id}
                    className="p-4 rounded-xl border border-border bg-surface/30 hover:bg-surface/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-accent">{subtopic.id}</span>
                        <h4 className="font-semibold text-sm text-foreground">{subtopic.label}</h4>
                      </div>
                      <Button
                        size="sm"
                        variant={reviewedIds.has(subtopic.id) ? "secondary" : "outline"}
                        isLoading={pendingSubtopicId === subtopic.id}
                        onClick={() => void handleToggleReview(subtopic.id, subtopic.label)}
                      >
                        {reviewedIds.has(subtopic.id) ? "Reviewed" : "Mark reviewed"}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {subtopic.keywords.slice(0, 8).map((keyword) => (
                        <span
                          key={keyword}
                          className="px-2 py-0.5 rounded-md bg-card border border-border text-[11px] text-muted-foreground"
                        >
                          {keyword}
                        </span>
                      ))}
                      {subtopic.keywords.length > 8 && (
                        <span className="text-[11px] text-muted-foreground">
                          +{subtopic.keywords.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "key-terms" && (
              <div className="flex flex-wrap gap-2">
                {allKeywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-foreground hover:border-accent/20 transition-colors"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}

            {activeTab === "practice" && (
              <WrittenAnswerChecker topicId={topicId} topicLabel={topicInfo.label} />
            )}

            {activeTab === "exam-questions" && (
              <div className="space-y-3">
                {topicContent.questions.length > 0 ? (
                  topicContent.questions.map((question) => {
                    const conceptTargets = getMarkSchemeConceptsForQuestion(question.id);

                    return (
                      <div
                        key={question.id}
                        className="rounded-xl border border-border bg-surface/30 px-4 py-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{question.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {question.sourceLabel}
                              {question.year ? ` • ${question.year}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {question.marks && (
                              <Badge variant="accent">{question.marks} marks</Badge>
                            )}
                            <Badge variant="default">{question.questionType.replace("-", " ")}</Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted mt-3 leading-relaxed">{question.summary}</p>
                        <div className="mt-3 rounded-lg bg-card/70 border border-border px-3 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-1">
                            Answer Focus
                          </p>
                          <p className="text-xs text-foreground/90 leading-relaxed">
                            {question.expectation}
                          </p>
                        </div>
                        {conceptTargets.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {conceptTargets[0].conceptTargets.slice(0, 3).map((target) => (
                              <span
                                key={target}
                                className="rounded-lg border border-border bg-card/60 px-2.5 py-1.5 text-[11px] text-muted-foreground"
                              >
                                {target}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <FileQuestion size={40} className="text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground mb-2">Past exam-style questions</p>
                    <p className="text-xs text-muted-foreground/70">
                      No mapped question metadata for this topic yet.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "weak-areas" && (
              <div className="space-y-3">
                {focusedSubtopics.length > 0 ? (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Based on your focus breakdown, these are the subtopics you marked for extra attention.
                    </p>
                    {focusedSubtopics.map((subtopic) => (
                      <div
                        key={subtopic.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-surface/50 border border-border"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-accent">{subtopic.id}</span>
                          <span className="text-sm font-medium text-foreground">{subtopic.label}</span>
                        </div>
                        <Button
                          size="sm"
                          variant={reviewedIds.has(subtopic.id) ? "secondary" : "outline"}
                          isLoading={pendingSubtopicId === subtopic.id}
                          onClick={() => void handleToggleReview(subtopic.id, subtopic.label)}
                        >
                          {reviewedIds.has(subtopic.id) ? "Reviewed" : "Review"}
                        </Button>
                      </div>
                    ))}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    You have not pinned any focused subtopics for this topic yet.
                  </p>
                )}
              </div>
            )}

            {activeTab === "progress" && (
              <div className="space-y-4">
                {topicProgress.totalSubtopics > 0 ? (
                  <>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-surface/50 border border-border">
                      <div className="text-3xl font-bold text-foreground">
                        {topicProgress.progressPercent}%
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">
                          Reviewed subtopics for {topicInfo.label}
                        </p>
                        <ProgressBar value={topicProgress.progressPercent} className="w-full" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      {tree.subtopics.map((subtopic) => (
                        <div
                          key={subtopic.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-surface/30 border border-border"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-accent">{subtopic.id}</span>
                            <span className="text-sm text-foreground">{subtopic.label}</span>
                          </div>
                          {reviewedIds.has(subtopic.id) ? (
                            <Badge variant="success" className="gap-1">
                              <CheckCircle2 size={12} />
                              Reviewed
                            </Badge>
                          ) : (
                            <Badge variant="default">Pending</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No trackable progress yet for this topic.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </PageContainer>
  );
}
