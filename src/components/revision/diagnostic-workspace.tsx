"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { Badge, Button, Card, ProgressBar } from "@/components/ui";
import {
  analyzeTopicDiagnosticSession,
  getDiagnosticTopics,
  getTopicDiagnosticDefinition,
  mergeDiagnosticResult,
  type DiagnosticFollowUpQuestion,
} from "@/lib/diagnostic";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getRecommendedMaterialCards } from "@/lib/content";
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

type Stage = "topic" | "baseline" | "follow-up" | "results";
type DiagnosticTopicOption = ReturnType<typeof getDiagnosticTopics>[number];

interface CurriculumTopicRow {
  id: string;
  label: string;
  icon: string;
  short_label: string;
}

const DIAGNOSTIC_STEPS: Array<{
  id: Stage;
  label: string;
  description: string;
}> = [
  { id: "topic", label: "Topic", description: "Choose one topic to assess." },
  { id: "baseline", label: "Baseline answer", description: "Explain what you already know." },
  { id: "follow-up", label: "Follow-up checks", description: "Clarify weak or missing points." },
  { id: "results", label: "Results", description: "See coverage and next steps." },
];

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
  return 14;
}

function getInitialTopicId(diagnostic: DiagnosticResult | null) {
  return (
    diagnostic?.recommendedTopicIds?.[0] ??
    diagnostic?.latestTopicId ??
    getDiagnosticTopics()[0]?.id ??
    ""
  );
}

function getStageIndex(stage: Stage) {
  return DIAGNOSTIC_STEPS.findIndex((item) => item.id === stage);
}

function DiagnosticStepHeader({ activeStage }: { activeStage: Stage }) {
  const activeIndex = getStageIndex(activeStage);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Diagnostic mode
          </p>
          <h2 className="mt-1 text-xl font-semibold text-foreground">
            Guided topic-first diagnostic
          </h2>
        </div>
        <Badge variant="accent">
          Step {activeIndex + 1} of {DIAGNOSTIC_STEPS.length}
        </Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {DIAGNOSTIC_STEPS.map((step, index) => {
          const isComplete = index < activeIndex;
          const isActive = step.id === activeStage;

          return (
            <div
              key={step.id}
              className={cn(
                "rounded-2xl border px-4 py-4",
                isActive
                  ? "surface-status-warning"
                  : isComplete
                    ? "surface-status-success"
                    : "surface-cutout"
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold",
                    isActive
                      ? "bg-accent/20 text-accent"
                      : isComplete
                        ? "bg-success/20 text-success"
                        : "bg-card text-muted-foreground"
                  )}
                >
                  {index + 1}
                </span>
                <p className="text-sm font-semibold text-foreground">{step.label}</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DiagnosticResultsSummary({ report }: { report: TopicDiagnosticReport }) {
  const coveredCount = report.curriculumPoints.filter((point) => point.status === "covered").length;
  const partialCount = report.curriculumPoints.filter((point) => point.status === "partial").length;
  const misconceptionCount = report.curriculumPoints.filter((point) => point.status === "misconception").length;
  const unassessedCount = report.curriculumPoints.filter((point) => point.status === "unassessed").length;
  const recommendedMaterials = getRecommendedMaterialCards([report.topicId], 3).filter((material) =>
    report.recommendedMaterialIds.includes(material.id)
  );

  return (
    <div className="space-y-5">
      <Card variant="success" className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-success" />
              <p className="text-sm font-semibold text-foreground">
                Diagnostic complete for {report.topicLabel}
              </p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              You now have a saved coverage map for this topic. Use it to move directly into weak-topic practice instead of guessing what to revise next.
            </p>
          </div>
          <div className="surface-cutout min-w-[180px] rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Diagnostic confidence</span>
              <span>{Math.round(report.confidence * 100)}%</span>
            </div>
            <ProgressBar value={Math.round(report.confidence * 100)} className="mt-3" size="sm" />
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Covered", value: coveredCount, tone: "success" as const },
            { label: "Partial", value: partialCount, tone: "warning" as const },
            { label: "Unassessed", value: unassessedCount, tone: "default" as const },
            { label: "Misconceptions", value: misconceptionCount, tone: "danger" as const },
          ].map((item) => (
            <div key={item.label} className="surface-cutout rounded-2xl px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {item.label}
              </p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-2xl font-bold text-foreground">{item.value}</p>
                <Badge variant={item.tone}>{item.label}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card variant="task" className="p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Target size={15} className="text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Point-by-point coverage</h3>
          </div>
          <div className="mt-4 space-y-3">
            {report.curriculumPoints.map((point) => (
              <div key={point.pointId} className="surface-cutout rounded-2xl px-4 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-accent">{point.pointId}</span>
                      <p className="text-sm font-semibold text-foreground">{point.label}</p>
                      <Badge variant={pointVariant(point.status)}>{pointLabel(point.status)}</Badge>
                    </div>
                    {point.notes && (
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{point.notes}</p>
                    )}
                  </div>
                  <div className="min-w-[180px] space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Coverage signal</span>
                      <span>{pointProgress(point.status)}%</span>
                    </div>
                    <ProgressBar value={pointProgress(point.status)} size="sm" />
                  </div>
                </div>
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Matched terms
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {point.matchedTerms.length > 0 ? (
                        point.matchedTerms.map((term) => (
                          <span
                            key={`${point.pointId}-${term}`}
                            className="rounded-lg bg-success/10 px-2.5 py-1 text-[11px] text-success"
                          >
                            {term}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No clear signals matched yet.</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Still missing
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {point.missingTerms.length > 0 ? (
                        point.missingTerms.map((term) => (
                          <span
                            key={`${point.pointId}-missing-${term}`}
                            className="rounded-lg bg-warning/10 px-2.5 py-1 text-[11px] text-warning"
                          >
                            {term}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No major missing signals.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card variant="warning" className="p-5">
            <div className="flex items-center gap-2">
              <ClipboardCheck size={14} className="text-warning" />
              <h3 className="text-sm font-semibold text-foreground">Next revision targets</h3>
            </div>
            <div className="mt-4 space-y-2">
              {report.suggestedNextTargets.length > 0 ? (
                report.suggestedNextTargets.map((target) => (
                  <div
                    key={target}
                    className="rounded-xl border border-border bg-surface/30 px-3 py-3 text-sm text-foreground"
                  >
                    {target}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No urgent weak targets remain for this topic.
                </p>
              )}
            </div>
          </Card>

          <Card variant="support" className="p-5">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-accent" />
              <h3 className="text-sm font-semibold text-foreground">Suggested support material</h3>
            </div>
            <div className="mt-4 space-y-2">
              {recommendedMaterials.length > 0 ? (
                recommendedMaterials.map((material) => (
                  <div key={material.id} className="surface-cutout rounded-xl px-3 py-3">
                    <p className="text-sm font-medium text-foreground">{material.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{material.description}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Open the topic resources route to review supporting material.
                </p>
              )}
            </div>
          </Card>

          <Card variant="navigation" className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Next step
            </p>
            <div className="mt-4 space-y-3">
              <Link href="/revision/weak-areas">
                <Button className="w-full">
                  Start weak-topic practice
                  <ArrowRight size={14} />
                </Button>
              </Link>
              <Link href={`/revision/${report.topicId}/practice`}>
                <Button variant="outline" className="w-full">
                  Open this topic practice hub
                </Button>
              </Link>
              <Link href={`/revision/${report.topicId}/resources`}>
                <Button variant="ghost" className="w-full">
                  Review topic resources
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function DiagnosticWorkspace({
  diagnostic,
  onComplete,
}: DiagnosticWorkspaceProps) {
  const [databaseTopics, setDatabaseTopics] = useState<DiagnosticTopicOption[]>(() => getDiagnosticTopics());
  const [previewTopicId, setPreviewTopicId] = useState(() => getInitialTopicId(diagnostic));
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("topic");
  const [freeformResponse, setFreeformResponse] = useState("");
  const [followUpResponse, setFollowUpResponse] = useState("");
  const [analysis, setAnalysis] = useState<TopicDiagnosticReport | null>(null);
  const [completedReport, setCompletedReport] = useState<TopicDiagnosticReport | null>(null);
  const [pendingFollowUp, setPendingFollowUp] = useState<DiagnosticFollowUpQuestion | null>(null);
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
  const previewTopic = topics.find((topic) => topic.id === previewTopicId) ?? topics[0];
  const previewDefinition = previewTopic ? getTopicDiagnosticDefinition(previewTopic.id) : null;
  const activeTopic = topics.find((topic) => topic.id === activeTopicId) ?? previewTopic;
  const activeDefinition = activeTopic ? getTopicDiagnosticDefinition(activeTopic.id) : null;
  const targetedPoint =
    pendingFollowUp && analysis
      ? analysis.curriculumPoints.find((point) => point.pointId === pendingFollowUp.targetedPointId)
      : null;
  const currentStage: Stage = stage;
  const followUpCount = followUps.length + (pendingFollowUp ? 1 : 0);
  const baselineWordCount = freeformResponse.trim().split(/\s+/).filter(Boolean).length;
  const followUpWordCount = followUpResponse.trim().split(/\s+/).filter(Boolean).length;
  const progressValue = useMemo(() => {
    switch (stage) {
      case "topic":
        return 12;
      case "baseline":
        return 35;
      case "follow-up":
        return 55 + Math.min(followUps.length, 2) * 15;
      case "results":
        return 100;
      default:
        return 0;
    }
  }, [followUps.length, stage]);

  function resetFlow(nextPreviewTopicId = activeTopic?.id ?? previewTopicId) {
    setPreviewTopicId(nextPreviewTopicId);
    setActiveTopicId(null);
    setStage("topic");
    setFreeformResponse("");
    setFollowUpResponse("");
    setAnalysis(null);
    setCompletedReport(null);
    setPendingFollowUp(null);
    setFollowUps([]);
    setError("");
    setIsSubmitting(false);
  }

  function startTopic(topicId: string) {
    setPreviewTopicId(topicId);
    setActiveTopicId(topicId);
    setStage("baseline");
    setFreeformResponse("");
    setFollowUpResponse("");
    setAnalysis(null);
    setCompletedReport(null);
    setPendingFollowUp(null);
    setFollowUps([]);
    setError("");
  }

  async function persistAndShowResults(report: TopicDiagnosticReport) {
    setIsSubmitting(true);
    setError("");

    try {
      await onComplete(mergeDiagnosticResult(diagnostic, report));
      setCompletedReport(report);
      setStage("results");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save the diagnostic result."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function runInitialAnalysis() {
    if (!activeTopic) return;
    if (freeformResponse.trim().length < 40) {
      setError("Write a fuller explanation before starting the diagnostic.");
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
        await persistAndShowResults(result.report);
        return;
      }
    } catch (analysisError) {
      setError(
        analysisError instanceof Error
          ? analysisError.message
          : "Unable to analyse this topic yet."
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

      if (result.nextFollowUp) {
        setStage("follow-up");
      } else {
        await persistAndShowResults(result.report);
        return;
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
    <div className="space-y-6">
      <DiagnosticStepHeader activeStage={currentStage} />

      <Card variant="navigation" className="rounded-[32px] p-5 sm:p-7">
        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </div>
        )}

        {stage === "topic" && previewTopic && previewDefinition && (
          <div className="space-y-6">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
                <BrainCircuit size={12} />
                Diagnostic mode
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Start with one topic and prove what you already know.
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                This flow checks curriculum coverage from a freeform explanation, then asks targeted follow-ups only where the evidence is still weak.
              </p>
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[30px] border border-accent/20 bg-[linear-gradient(145deg,rgba(139,92,246,0.18),rgba(17,17,19,0.95)_42%,rgba(17,17,19,1))] p-6 shadow-[0_0_40px_-22px_rgba(139,92,246,0.7)]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl">
                        {previewTopic.icon}
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Selected topic
                        </p>
                        <h2 className="text-2xl font-semibold text-foreground">{previewTopic.label}</h2>
                      </div>
                    </div>
                    <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                      {previewDefinition.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:max-w-[220px] sm:justify-end">
                    <Badge variant="accent">{previewDefinition.points.length} points assessed</Badge>
                    <Badge variant="default">Freeform first</Badge>
                    <Badge variant="warning">Targeted follow-ups</Badge>
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
                    You will write one baseline explanation, then answer only the follow-up checks needed for this topic.
                  </p>
                  <Button size="lg" onClick={() => startTopic(previewTopic.id)}>
                    Start diagnostic for this topic
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </motion.div>

              <Card variant="support" className="p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  How this flow works
                </p>
                <div className="mt-4 space-y-3">
                  {[
                    "Choose one topic instead of landing in a mixed workspace.",
                    "Write what you already know in your own words.",
                    "Answer only the follow-up checks needed to confirm weak points.",
                    "Finish with a saved results summary and direct next-step practice.",
                  ].map((item) => (
                    <div key={item} className="surface-cutout rounded-xl px-3 py-3 text-sm text-foreground">
                      {item}
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {topics.map((topic) => {
                const definition = getTopicDiagnosticDefinition(topic.id);
                const isPreview = previewTopicId === topic.id;

                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => setPreviewTopicId(topic.id)}
                    className={cn(
                      "rounded-2xl border px-4 py-4 text-left transition-all",
                      isPreview
                        ? "border-accent/40 bg-accent/10 shadow-[0_0_20px_-8px_rgba(139,92,246,0.3)]"
                        : "surface-cutout hover:border-accent/20 hover:bg-card/80"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-card text-lg">
                        {topic.icon}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{topic.label}</p>
                        <p className="text-xs text-muted-foreground">{definition?.points.length ?? 0} mapped points</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {(stage === "baseline" || stage === "follow-up") && activeTopic && activeDefinition && (
          <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
            <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
              <Card variant="support" className="p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-xl">
                    {activeTopic.icon}
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Active topic
                    </p>
                    <h2 className="text-lg font-semibold text-foreground">{activeTopic.label}</h2>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {activeDefinition.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {activeDefinition.points.slice(0, 4).map((point) => (
                    <span key={point.id} className="surface-cutout rounded-xl px-2.5 py-1 text-[11px] text-muted-foreground">
                      {point.id}
                    </span>
                  ))}
                </div>
              </Card>

              <Card variant="warning" className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Current step
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {stage === "baseline" ? "Explain what you already know" : `Follow-up check ${followUpCount}`}
                    </p>
                  </div>
                  <Badge variant="accent">{stage === "baseline" ? "Baseline" : "Follow-up"}</Badge>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Diagnostic progress</span>
                    <span>{progressValue}%</span>
                  </div>
                  <ProgressBar value={progressValue} className="mt-3" size="sm" />
                </div>
                <div className="mt-4 space-y-2">
                  <Button variant="outline" onClick={() => resetFlow(activeTopic.id)}>
                    Change topic
                  </Button>
                  <Link href="/revision">
                    <Button variant="ghost" className="w-full">
                      Back to revision hub
                    </Button>
                  </Link>
                </div>
              </Card>

              {analysis && (
                <Card variant="support" className="p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    What is being assessed
                  </p>
                  <div className="mt-4 space-y-2">
                    {analysis.curriculumPoints.map((point) => (
                      <div key={point.pointId} className="surface-cutout rounded-xl px-3 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-accent">{point.pointId}</span>
                          <p className="text-sm font-medium text-foreground">{point.label}</p>
                          <Badge variant={pointVariant(point.status)}>{pointLabel(point.status)}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            <div className="space-y-5">
              <Card variant="task" className="overflow-hidden p-0">
                <div className="border-b border-border/80 bg-[linear-gradient(180deg,rgba(139,92,246,0.08),transparent)] px-5 py-4 sm:px-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-accent" />
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          {stage === "baseline" ? "Baseline explanation" : "Targeted follow-up"}
                        </span>
                      </div>
                      <h3 className="mt-2 text-xl font-semibold text-foreground">
                        {stage === "baseline"
                          ? "What do you already know about this topic?"
                          : pendingFollowUp?.question}
                      </h3>
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                        {stage === "baseline"
                          ? "Write naturally. Mention the concepts, links, processes, and examples you would use if you were explaining this topic in an exam."
                          : "This question is targeted at one weak or missing curriculum signal. Clarify it before you move on."}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="accent">{stage === "baseline" ? "Freeform first" : "One point at a time"}</Badge>
                      <Badge variant="default">Curriculum matched</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 px-5 py-5 sm:px-6">
                  {targetedPoint && (
                    <div className="rounded-2xl border border-warning/20 bg-warning/10 px-4 py-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-warning">
                            Targeted point
                          </p>
                          <p className="mt-1 text-sm font-medium text-foreground">
                            {targetedPoint.pointId} {targetedPoint.label}
                          </p>
                        </div>
                        <Badge variant={pointVariant(targetedPoint.status)}>{pointLabel(targetedPoint.status)}</Badge>
                      </div>
                    </div>
                  )}

                  {stage === "baseline" ? (
                    <textarea
                      value={freeformResponse}
                      onChange={(event) => {
                        setFreeformResponse(event.target.value);
                        setError("");
                      }}
                      rows={12}
                      placeholder="Explain the topic in your own words. Mention terms, examples, design choices, and consequences where relevant."
                      className="min-h-[280px] w-full rounded-[24px] border border-border bg-surface/40 px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                    />
                  ) : (
                    <textarea
                      value={followUpResponse}
                      onChange={(event) => {
                        setFollowUpResponse(event.target.value);
                        setError("");
                      }}
                      rows={8}
                      placeholder="Add the missing concept, clarification, or example this follow-up is asking for."
                      className="min-h-[220px] w-full rounded-[24px] border border-border bg-surface/40 px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                    />
                  )}

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-[11px] text-muted-foreground/70">
                        Deterministic matching against structured topic points, key terms, misconception rules, and follow-up history.
                      </p>
                      <p className="text-[11px] text-muted-foreground/50 tabular-nums">
                        {stage === "baseline" ? baselineWordCount : followUpWordCount} words
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {stage === "follow-up" && analysis && (
                        <Button
                          variant="outline"
                          onClick={() => void persistAndShowResults(analysis)}
                          disabled={isSubmitting}
                        >
                          Finish diagnostic and view results
                        </Button>
                      )}
                      <Button
                        onClick={() => void (stage === "baseline" ? runInitialAnalysis() : runFollowUp())}
                        isLoading={isSubmitting}
                      >
                        {stage === "baseline"
                          ? "Start diagnostic for this topic"
                          : "Continue to next diagnostic check"}
                        <ArrowRight size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {stage === "results" && completedReport && (
          <DiagnosticResultsSummary report={completedReport} />
        )}
      </Card>
    </div>
  );
}
