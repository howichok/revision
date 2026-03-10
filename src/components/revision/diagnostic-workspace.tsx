"use client";

import { useEffect, useState } from "react";
import { LayoutGroup, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { Badge, Button, Card, ProgressBar } from "@/components/ui";
import { QuickQuiz } from "@/components/revision/quick-quiz";
import {
  analyzeTopicDiagnosticSession,
  getDiagnosticTopics,
  getTopicDiagnosticDefinition,
  mergeDiagnosticResult,
  type DiagnosticFollowUpQuestion,
} from "@/lib/diagnostic";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";
import type {
  DiagnosticFollowUpEntry,
  DiagnosticPointStatus,
  DiagnosticResult,
  TopicDiagnosticReport,
} from "@/lib/types";

interface DiagnosticWorkspaceProps {
  diagnostic: DiagnosticResult | null;
  onComplete: (result: DiagnosticResult) => Promise<void>;
}

type WorkspaceMode = "diagnose" | "quiz";
type Stage = "selection" | "intake" | "follow-up";
type DiagnosticTopicOption = ReturnType<typeof getDiagnosticTopics>[number];

interface CurriculumTopicRow {
  id: string;
  label: string;
  icon: string;
  short_label: string;
}

function pointVariant(status: DiagnosticPointStatus) {
  if (status === "covered") return "success" as const;
  if (status === "partial") return "warning" as const;
  if (status === "misconception") return "danger" as const;
  return "default" as const;
}

function pointLabel(status: DiagnosticPointStatus) {
  if (status === "covered") return "Covered well";
  if (status === "partial") return "Partially covered";
  if (status === "misconception") return "Misconception detected";
  return "Not assessed";
}

function pointProgress(status: DiagnosticPointStatus) {
  if (status === "covered") return 92;
  if (status === "partial") return 54;
  if (status === "misconception") return 28;
  return 16;
}

function getInitialTopicId(diagnostic: DiagnosticResult | null) {
  return (
    diagnostic?.recommendedTopicIds?.[0] ??
    diagnostic?.latestTopicId ??
    getDiagnosticTopics()[0]?.id ??
    ""
  );
}

export function DiagnosticWorkspace({
  diagnostic,
  onComplete,
}: DiagnosticWorkspaceProps) {
  const [databaseTopics, setDatabaseTopics] = useState<DiagnosticTopicOption[]>(
    () => getDiagnosticTopics()
  );
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("diagnose");
  const [previewTopicId, setPreviewTopicId] = useState(() =>
    getInitialTopicId(diagnostic)
  );
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("selection");
  const [freeformResponse, setFreeformResponse] = useState("");
  const [followUpResponse, setFollowUpResponse] = useState("");
  const [analysis, setAnalysis] = useState<TopicDiagnosticReport | null>(null);
  const [pendingFollowUp, setPendingFollowUp] =
    useState<DiagnosticFollowUpQuestion | null>(null);
  const [followUps, setFollowUps] = useState<DiagnosticFollowUpEntry[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const config = getSupabaseConfig();

    if (!config) {
      return;
    }

    const supabase = getBrowserSupabaseClient();
    let cancelled = false;

    void supabase
      .from("curriculum_topics")
      .select("id, label, icon, short_label")
      .order("sort_order", { ascending: true })
      .then(({ data, error: loadError }) => {
        if (cancelled || loadError || !data || data.length === 0) {
          return;
        }

        const fallbackTopics = getDiagnosticTopics();
        const nextTopics = (data as CurriculumTopicRow[])
          .map((row) => {
            const fallbackTopic = fallbackTopics.find((topic) => topic.id === row.id);

            if (!fallbackTopic) {
              return null;
            }

            return {
              ...fallbackTopic,
              label: row.label,
              icon: row.icon,
              shortLabel: row.short_label,
            };
          })
          .filter((topic): topic is DiagnosticTopicOption => Boolean(topic));

        if (nextTopics.length > 0) {
          setDatabaseTopics(nextTopics);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const topics = databaseTopics;

  const previewTopic =
    topics.find((topic) => topic.id === previewTopicId) ?? topics[0];
  const previewDefinition = previewTopic
    ? getTopicDiagnosticDefinition(previewTopic.id)
    : null;
  const previewScore = diagnostic?.topicScores.find(
    (score) => score.category === previewTopic?.id
  );
  const previewReport = diagnostic?.topicDiagnostics?.find(
    (report) => report.topicId === previewTopic?.id
  );
  const activeTopic =
    topics.find((topic) => topic.id === activeTopicId) ?? previewTopic;
  const activeDefinition = activeTopic
    ? getTopicDiagnosticDefinition(activeTopic.id)
    : null;
  const targetedPoint =
    pendingFollowUp && analysis
      ? analysis.curriculumPoints.find(
          (point) => point.pointId === pendingFollowUp.targetedPointId
        )
      : null;

  function resetToSelection(nextPreviewTopicId = activeTopic?.id ?? previewTopicId) {
    setPreviewTopicId(nextPreviewTopicId);
    setActiveTopicId(null);
    setStage("selection");
    setFreeformResponse("");
    setFollowUpResponse("");
    setAnalysis(null);
    setPendingFollowUp(null);
    setFollowUps([]);
    setError("");
    setIsSubmitting(false);
  }

  function startTopic(topicId: string) {
    setPreviewTopicId(topicId);
    setActiveTopicId(topicId);
    setStage("intake");
    setFreeformResponse("");
    setFollowUpResponse("");
    setAnalysis(null);
    setPendingFollowUp(null);
    setFollowUps([]);
    setError("");
  }

  async function saveReport(report: TopicDiagnosticReport) {
    setIsSubmitting(true);
    setError("");

    try {
      await onComplete(mergeDiagnosticResult(diagnostic, report));
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save the diagnostic result."
      );
      setIsSubmitting(false);
    }
  }

  async function runInitialAnalysis() {
    if (!activeTopic) return;
    if (freeformResponse.trim().length < 40) {
      setError("Write a fuller explanation before running the diagnostic.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const result = analyzeTopicDiagnosticSession({
        topicId: activeTopic.id,
        freeformResponse,
      });
      setAnalysis(result.report);
      setPendingFollowUp(result.nextFollowUp);

      if (result.nextFollowUp) {
        setStage("follow-up");
      } else {
        await saveReport(result.report);
      }
    } catch (analysisError) {
      setError(
        analysisError instanceof Error
          ? analysisError.message
          : "Unable to analyze this topic yet."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function runFollowUp() {
    if (!activeTopic || !pendingFollowUp || !analysis) return;
    if (followUpResponse.trim().length < 12) {
      setError("Add a short follow-up answer so the diagnostic can refine the point.");
      return;
    }

    const nextFollowUps = [
      ...followUps,
      {
        id: pendingFollowUp.id,
        targetedPointId: pendingFollowUp.targetedPointId,
        question: pendingFollowUp.question,
        answer: followUpResponse.trim(),
        reason: pendingFollowUp.reason,
      },
    ];

    setIsSubmitting(true);
    setError("");

    try {
      const result = analyzeTopicDiagnosticSession({
        topicId: activeTopic.id,
        freeformResponse,
        followUps: nextFollowUps,
      });
      setFollowUps(nextFollowUps);
      setFollowUpResponse("");
      setAnalysis(result.report);
      setPendingFollowUp(result.nextFollowUp);

      if (!result.nextFollowUp) {
        await saveReport(result.report);
      }
    } catch (analysisError) {
      setError(
        analysisError instanceof Error
          ? analysisError.message
          : "Unable to refine this diagnostic."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <LayoutGroup id="diagnostic-workspace">
      <div className="relative overflow-hidden rounded-[32px] border border-border bg-card/90 p-5 sm:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.18),transparent_42%),linear-gradient(180deg,rgba(139,92,246,0.05),transparent_30%)]" />
        <div className="relative z-10 space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          {stage === "selection" ? (
            <div className="space-y-8">
              {/* ── Mode tabs ── */}
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-1 rounded-2xl border border-border bg-surface/60 p-1">
                  <button
                    onClick={() => setWorkspaceMode("diagnose")}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all cursor-pointer",
                      workspaceMode === "diagnose"
                        ? "bg-card text-foreground shadow-sm border border-border"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <BrainCircuit size={14} />
                    Adaptive Diagnostic
                  </button>
                  <button
                    onClick={() => setWorkspaceMode("quiz")}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all cursor-pointer",
                      workspaceMode === "quiz"
                        ? "bg-card text-foreground shadow-sm border border-border"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Zap size={14} />
                    Quick Quiz
                  </button>
                </div>
              </div>

              {workspaceMode === "quiz" ? (
                <QuickQuiz onClose={() => setWorkspaceMode("diagnose")} />
              ) : (
                <>
                  {/* ── Diagnose header ── */}
                  <div className="mx-auto max-w-3xl text-center">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
                      <BrainCircuit size={12} />
                      Adaptive Diagnostic Workspace
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                      Start from a topic, not a quiz stack.
                    </h1>
                    <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted">
                      Select one topic, explain what you already know, then let the
                      system map that freeform answer against the curriculum.
                    </p>
                  </div>

                  {/* ── Featured topic preview ── */}
                  {previewTopic && previewDefinition && (
                    <div className="flex justify-center">
                      <motion.div
                        layoutId={`diagnostic-topic-${previewTopic.id}`}
                        className="w-full max-w-3xl rounded-[30px] border border-accent/20 bg-[linear-gradient(145deg,rgba(139,92,246,0.18),rgba(17,17,19,0.95)_42%,rgba(17,17,19,1))] p-6 shadow-[0_0_40px_-22px_rgba(139,92,246,0.7)]"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl">
                                {previewTopic.icon}
                              </span>
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                  Featured topic
                                </p>
                                <h2 className="text-2xl font-semibold text-foreground">
                                  {previewTopic.label}
                                </h2>
                              </div>
                            </div>
                            <p className="max-w-2xl text-sm leading-relaxed text-muted">
                              {previewDefinition.description}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2 sm:max-w-[240px] sm:justify-end">
                            <Badge variant="accent">{previewDefinition.points.length} points</Badge>
                            <Badge variant="default">Freeform first</Badge>
                            {previewScore && (
                              <Badge variant="warning">
                                {Math.round((previewScore.score / previewScore.maxScore) * 100)}%
                              </Badge>
                            )}
                            {previewReport && (
                              <Badge variant="success">
                                {Math.round(previewReport.confidence * 100)}% confidence
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                          {previewDefinition.points.slice(0, 3).map((point) => (
                            <div key={point.id} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                {point.id}
                              </p>
                              <p className="mt-1 text-sm font-medium text-foreground">{point.label}</p>
                            </div>
                          ))}
                        </div>

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-xs text-muted-foreground">
                            Deterministic matching only. No hosted AI model is used here.
                          </p>
                          <div className="flex gap-2">
                            <Button size="lg" onClick={() => startTopic(previewTopic.id)}>
                              Diagnose {previewTopic.label}
                              <ArrowRight size={16} />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {/* ── Topic grid ── */}
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {topics.map((topic) => {
                      const definition = getTopicDiagnosticDefinition(topic.id);
                      const structured = diagnostic?.topicDiagnostics?.some((report) => report.topicId === topic.id);
                      const isPreview = previewTopicId === topic.id;

                      return (
                        <button
                          key={topic.id}
                          type="button"
                          onClick={() => setPreviewTopicId(topic.id)}
                          className={cn(
                            "rounded-2xl border px-4 py-4 text-left transition-all cursor-pointer group",
                            isPreview
                              ? "border-accent/40 bg-accent/10 shadow-[0_0_20px_-8px_rgba(139,92,246,0.3)]"
                              : "border-border bg-surface/40 hover:border-accent/20 hover:bg-card/80 hover:shadow-[0_4px_16px_-4px_rgba(139,92,246,0.08)]"
                          )}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-2xl border text-lg transition-colors",
                                isPreview
                                  ? "border-accent/20 bg-accent/10"
                                  : "border-border bg-card group-hover:border-accent/15"
                              )}>
                                {topic.icon}
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-foreground">{topic.label}</p>
                                <p className="text-xs text-muted-foreground">{definition?.points.length ?? 0} mapped points</p>
                              </div>
                            </div>
                            <Badge variant={structured ? "success" : "default"}>
                              {structured ? "Mapped" : "New"}
                            </Badge>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ) : (
            /* ─── Active diagnostic (intake / follow-up) ─── */
            <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
              <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
                {activeTopic && activeDefinition && (
                  <motion.div
                    layoutId={`diagnostic-topic-${activeTopic.id}`}
                    className="rounded-[28px] border border-accent/20 bg-[linear-gradient(160deg,rgba(139,92,246,0.16),rgba(17,17,19,0.96)_45%,rgba(17,17,19,1))] p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xl">
                          {activeTopic.icon}
                        </span>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Active topic</p>
                          <h2 className="text-lg font-semibold text-foreground">{activeTopic.label}</h2>
                        </div>
                      </div>
                      <Badge variant="accent">{activeDefinition.points.length} points</Badge>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{activeDefinition.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {activeDefinition.points.slice(0, 4).map((point) => (
                        <span key={point.id} className="rounded-xl border border-white/8 bg-black/20 px-2.5 py-1 text-[11px] text-muted">
                          {point.id}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}

                <Card className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Topic anchor</p>
                      <p className="mt-1 text-sm text-foreground">Switch topic without leaving the workspace.</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => resetToSelection()}>
                      Change
                    </Button>
                  </div>
                  <div className="mt-4 space-y-2">
                    {topics.map((topic) => (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => startTopic(topic.id)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-colors cursor-pointer",
                          topic.id === activeTopic?.id
                            ? "border-accent/30 bg-accent/10 text-foreground"
                            : "border-border bg-surface/30 text-muted-foreground hover:border-accent/20 hover:bg-card"
                        )}
                      >
                        <span className="flex items-center gap-2 text-sm font-medium">
                          <span>{topic.icon}</span>
                          {topic.label}
                        </span>
                        {topic.id === activeTopic?.id ? (
                          <CheckCircle2 size={14} className="text-accent" />
                        ) : (
                          <span className="text-[11px] uppercase tracking-[0.16em]">open</span>
                        )}
                      </button>
                    ))}
                  </div>
                </Card>
              </div>

              <div className="space-y-5">
                <Card className="overflow-hidden border-border/80 bg-card/80 p-0">
                  <div className="border-b border-border/80 bg-[linear-gradient(180deg,rgba(139,92,246,0.08),transparent)] px-5 py-4 sm:px-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Sparkles size={14} className="text-accent" />
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            {stage === "intake" ? "Freeform input" : "Adaptive follow-up"}
                          </span>
                        </div>
                        <h3 className="mt-2 text-xl font-semibold text-foreground">
                          {stage === "intake" ? "What do you already know about this topic?" : pendingFollowUp?.question}
                        </h3>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                          {stage === "intake"
                            ? "Write freely. Mention the concepts, processes, examples, and exam language you already know."
                            : "This follow-up is chosen from the missing or weak curriculum signals in your answer."}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="accent">{stage === "intake" ? "Freeform first" : "One point at a time"}</Badge>
                        <Badge variant="default">Curriculum matched</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 px-5 py-5 sm:px-6">
                    {targetedPoint && (
                      <div className="rounded-2xl border border-warning/20 bg-warning/10 px-4 py-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-warning">Targeted point</p>
                            <p className="mt-1 text-sm font-medium text-foreground">{targetedPoint.pointId} {targetedPoint.label}</p>
                          </div>
                          <Badge variant={pointVariant(targetedPoint.status)}>{pointLabel(targetedPoint.status)}</Badge>
                        </div>
                      </div>
                    )}

                    {stage === "intake" ? (
                      <textarea
                        value={freeformResponse}
                        onChange={(event) => { setFreeformResponse(event.target.value); setError(""); }}
                        rows={12}
                        placeholder="Explain the topic in your own words. Mention terms, links, and examples."
                        className="min-h-[280px] w-full rounded-[24px] border border-border bg-surface/40 px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                      />
                    ) : (
                      <textarea
                        value={followUpResponse}
                        onChange={(event) => { setFollowUpResponse(event.target.value); setError(""); }}
                        rows={8}
                        placeholder="Add the missing concept, correction, or example this follow-up is asking for."
                        className="min-h-[220px] w-full rounded-[24px] border border-border bg-surface/40 px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                      />
                    )}

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-[11px] text-muted-foreground/70">
                          Deterministic matching against structured topic points, key terms, misconception rules, and follow-up history.
                        </p>
                        <p className="text-[11px] text-muted-foreground/50 tabular-nums">
                          {(stage === "intake" ? freeformResponse : followUpResponse).trim().split(/\s+/).filter(Boolean).length} words
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {stage === "follow-up" && analysis && (
                          <Button variant="outline" onClick={() => void saveReport(analysis)} disabled={isSubmitting}>
                            Finish with current map
                          </Button>
                        )}
                        <Button onClick={() => void (stage === "intake" ? runInitialAnalysis() : runFollowUp())} isLoading={isSubmitting}>
                          {stage === "intake" ? "Analyze topic coverage" : "Apply follow-up answer"}
                          <ArrowRight size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                {analysis && (
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                    <Card className="p-5 sm:p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Target size={15} className="text-accent" />
                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Coverage map</span>
                          </div>
                          <h3 className="mt-2 text-lg font-semibold text-foreground">Point-by-point curriculum coverage</h3>
                        </div>
                        <div className="min-w-[170px] space-y-2 rounded-2xl border border-border bg-surface/30 px-4 py-3">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Confidence</span>
                            <span>{Math.round(analysis.confidence * 100)}%</span>
                          </div>
                          <ProgressBar value={Math.round(analysis.confidence * 100)} size="sm" color="accent" />
                        </div>
                      </div>

                      <div className="mt-5 space-y-3">
                        {analysis.curriculumPoints.map((point) => (
                          <div key={point.pointId} className="rounded-2xl border border-border bg-surface/20 px-4 py-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono text-xs text-accent">{point.pointId}</span>
                                  <p className="text-sm font-semibold text-foreground">{point.label}</p>
                                  <Badge variant={pointVariant(point.status)}>{pointLabel(point.status)}</Badge>
                                </div>
                                {point.notes && <p className="mt-2 text-xs leading-relaxed text-muted">{point.notes}</p>}
                              </div>
                              <div className="min-w-[180px] space-y-2">
                                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                  <span>Coverage signal</span>
                                  <span>{pointProgress(point.status)}%</span>
                                </div>
                                <ProgressBar value={pointProgress(point.status)} size="sm" />
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {point.matchedTerms.map((term) => (
                                <span key={`${point.pointId}-${term}`} className="rounded-lg bg-success/10 px-2.5 py-1 text-[11px] text-success">
                                  {term}
                                </span>
                              ))}
                              {point.missingTerms.slice(0, 3).map((term) => (
                                <span key={`${point.pointId}-missing-${term}`} className="rounded-lg bg-warning/10 px-2.5 py-1 text-[11px] text-warning">
                                  {term}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <div className="space-y-4">
                      <Card className="p-5">
                        <div className="flex items-center gap-2">
                          <Sparkles size={14} className="text-success" />
                          <h3 className="text-sm font-semibold text-foreground">Signals matched</h3>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {analysis.keyTermsMatched.length > 0 ? (
                            analysis.keyTermsMatched.map((term) => (
                              <span key={term} className="rounded-lg bg-success/10 px-2.5 py-1 text-[11px] text-success">
                                {term}
                              </span>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground">No clear topic language has been matched yet.</p>
                          )}
                        </div>
                      </Card>

                      <Card className="p-5">
                        <div className="flex items-center gap-2">
                          <AlertCircle size={14} className="text-danger" />
                          <h3 className="text-sm font-semibold text-foreground">Misconceptions and targets</h3>
                        </div>
                        <div className="mt-4 space-y-3">
                          {analysis.misconceptions.map((misconception) => (
                            <div key={`${misconception.pointId ?? "topic"}-${misconception.id}`} className="rounded-2xl border border-danger/20 bg-danger/10 px-3 py-3">
                              <p className="text-sm font-medium text-foreground">{misconception.label}</p>
                              <p className="mt-1 text-xs leading-relaxed text-muted">{misconception.explanation}</p>
                            </div>
                          ))}
                          {analysis.suggestedNextTargets.map((target) => (
                            <div key={target} className="rounded-xl border border-border bg-surface/30 px-3 py-2 text-xs text-foreground">
                              {target}
                            </div>
                          ))}
                          {analysis.misconceptions.length === 0 && analysis.suggestedNextTargets.length === 0 && (
                            <p className="text-xs text-muted-foreground">No major weak targets remain.</p>
                          )}
                        </div>
                      </Card>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </LayoutGroup>
  );
}
