"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  ClipboardCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { ActiveLearningLayout } from "@/components/revision/active-learning/active-learning-layout";
import { LearningRail } from "@/components/revision/active-learning/learning-rail";
import { MobileLearningRail } from "@/components/revision/active-learning/mobile-learning-rail";
import { buildLinearRailItems } from "@/components/revision/active-learning/rail-builders";
import { TaskContextStrip } from "@/components/revision/active-learning/task-context-strip";
import { TaskFeedbackPanel } from "@/components/revision/active-learning/task-feedback-panel";
import { TaskPanel } from "@/components/revision/active-learning/task-panel";
import { TaskResponsePanel } from "@/components/revision/active-learning/task-response-panel";
import { LearningOutcomePanel } from "@/components/revision/learning-outcome-panel";
import { Badge, Button, Card, ProgressBar } from "@/components/ui";
import {
  analyzeTopicDiagnosticSession,
  getDiagnosticTopics,
  getTopicDiagnosticDefinition,
  mergeDiagnosticResult,
  type DiagnosticFollowUpQuestion,
} from "@/lib/diagnostic";
import { getRecommendedMaterialCards } from "@/lib/content";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";
import type {
  DiagnosticFollowUpEntry,
  DiagnosticPointAssessment,
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

function getWordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function DiagnosticError({ error }: { error: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
      <AlertCircle size={14} className="shrink-0" />
      {error}
    </div>
  );
}

function DiagnosticTopicSelectionState({
  topics,
  previewTopicId,
  setPreviewTopicId,
  startTopic,
  error,
}: {
  topics: DiagnosticTopicOption[];
  previewTopicId: string;
  setPreviewTopicId: (topicId: string) => void;
  startTopic: (topicId: string) => void;
  error: string;
}) {
  const previewTopic = topics.find((topic) => topic.id === previewTopicId) ?? topics[0];
  const previewDefinition = previewTopic ? getTopicDiagnosticDefinition(previewTopic.id) : null;

  if (!previewTopic || !previewDefinition) {
    return null;
  }

  return (
    <div className="space-y-6">
      {error ? <DiagnosticError error={error} /> : null}

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
          <div className="mt-5">
            <Link href="/revision">
              <Button variant="ghost">Back to revision hub</Button>
            </Link>
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
  );
}

function DiagnosticResultsSummary({
  report,
  railItems,
}: {
  report: TopicDiagnosticReport;
  railItems: ReturnType<typeof buildLinearRailItems>;
}) {
  const coveredCount = report.curriculumPoints.filter((point) => point.status === "covered").length;
  const partialCount = report.curriculumPoints.filter((point) => point.status === "partial").length;
  const misconceptionCount = report.curriculumPoints.filter((point) => point.status === "misconception").length;
  const unassessedCount = report.curriculumPoints.filter((point) => point.status === "unassessed").length;
  const recommendedMaterials = getRecommendedMaterialCards([report.topicId], 3).filter((material) =>
    report.recommendedMaterialIds.includes(material.id)
  );
  const railSummary = [
    { label: "Coverage", value: `${coveredCount}/${report.curriculumPoints.length}`, tone: "success" as const },
    {
      label: "Confidence",
      value: `${Math.round(report.confidence * 100)}%`,
      tone: "accent" as const,
    },
    {
      label: "Targets",
      value: `${report.suggestedNextTargets.length}`,
      tone: report.suggestedNextTargets.length > 0 ? ("warning" as const) : ("default" as const),
    },
  ];

  return (
    <div className="al-shell">
      <MobileLearningRail
        backHref="/revision"
        railTitle={`${report.topicLabel} diagnostic`}
        railSubtitle="Saved topic-first diagnostic route."
        railIcon={<span className="text-lg">{report.topicIcon}</span>}
        railItems={railItems}
        railSummary={railSummary}
        mobileSummaryLabel="Results"
      />

      <div className="al-shell-grid">
        <LearningRail
          backHref="/revision"
          railTitle={`${report.topicLabel} diagnostic`}
          railSubtitle="Saved topic-first diagnostic route."
          railIcon={<span className="text-lg">{report.topicIcon}</span>}
          railItems={railItems}
          railSummary={railSummary}
        />

        <div className="al-task-column">
          <LearningOutcomePanel
            eyebrow="Diagnostic results"
            title={`Diagnostic complete for ${report.topicLabel}`}
            summary="You now have a saved coverage map for this topic. Use it to move directly into weak-topic practice instead of guessing what to revise next."
            tone={misconceptionCount > 0 ? "warning" : coveredCount > partialCount ? "success" : "accent"}
            progressLabel="Diagnostic confidence"
            progressValue={Math.round(report.confidence * 100)}
            badges={[
              { label: `${coveredCount} covered`, variant: "success" },
              { label: `${partialCount} partial`, variant: "warning" },
              { label: `${misconceptionCount} misconceptions`, variant: misconceptionCount > 0 ? "danger" : "default" },
            ]}
            primaryAction={{
              label: "Start weak-topic practice",
              href: "/revision/weak-areas",
            }}
            secondaryAction={{
              label: "Open topic practice",
              href: `/revision/${report.topicId}/practice`,
              variant: "secondary",
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
          </LearningOutcomePanel>

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
                      {point.notes ? (
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{point.notes}</p>
                      ) : null}
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

          <div className="grid gap-4 xl:grid-cols-2">
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

              <div className="mt-4">
                <Link href={`/revision/${report.topicId}/resources`}>
                  <Button variant="ghost">Review topic resources</Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildActiveRailItems({
  activeTopicLabel,
  stage,
  followUps,
  pendingFollowUp,
}: {
  activeTopicLabel: string;
  stage: Stage;
  followUps: DiagnosticFollowUpEntry[];
  pendingFollowUp: DiagnosticFollowUpQuestion | null;
}) {
  const followUpItems = [
    ...followUps.map((followUp, index) => ({
      id: followUp.id,
      label: `Follow-up ${index + 1}`,
      description: followUp.question,
      meta: "completed",
    })),
  ];

  if (stage === "follow-up" && pendingFollowUp) {
    followUpItems.push({
      id: pendingFollowUp.id,
      label: `Follow-up ${followUps.length + 1}`,
      description: pendingFollowUp.question,
      meta: "current",
    });
  }

  const items = [
    {
      id: "topic",
      label: "Topic selected",
      description: activeTopicLabel,
    },
    {
      id: "baseline",
      label: "Baseline answer",
      description: "Explain what you already know in your own words.",
    },
    ...followUpItems,
    {
      id: "results",
      label: "Results",
      description: "Saved topic diagnostic summary.",
    },
  ];

  const completedIds = new Set<string>(["topic"]);

  if (stage === "follow-up" || stage === "results") {
    completedIds.add("baseline");
    followUps.forEach((followUp) => completedIds.add(followUp.id));
  }

  return buildLinearRailItems(
    items,
    stage === "baseline"
      ? "baseline"
      : stage === "follow-up" && pendingFollowUp
        ? pendingFollowUp.id
        : "results",
    completedIds
  );
}

function getTargetedFeedbackSummary(point: DiagnosticPointAssessment | null) {
  if (!point) {
    return null;
  }

  if (point.status === "misconception") {
    return "The current evidence still suggests a misconception. Clarify the point directly before moving on.";
  }

  if (point.missingTerms.length > 0) {
    return `The follow-up is checking whether you can explain ${point.missingTerms.slice(0, 2).join(" and ")} clearly enough to move this point beyond partial coverage.`;
  }

  return point.notes ?? "This follow-up is confirming whether the missing evidence for the point is now strong enough.";
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
  const activeTopic = topics.find((topic) => topic.id === activeTopicId) ?? topics.find((topic) => topic.id === previewTopicId) ?? topics[0];
  const activeDefinition = activeTopic ? getTopicDiagnosticDefinition(activeTopic.id) : null;
  const targetedPoint =
    pendingFollowUp && analysis
      ? analysis.curriculumPoints.find((point) => point.pointId === pendingFollowUp.targetedPointId) ?? null
      : null;
  const activePrompt =
    stage === "baseline"
      ? "What do you already know about this topic?"
      : pendingFollowUp?.question ?? "Add the missing concept or clarification this follow-up is checking.";
  const activePromptDescription =
    stage === "baseline"
      ? "Write naturally. Mention the concepts, links, processes, and examples you would use if you were explaining this topic in an exam."
      : "This prompt is checking one weak or missing curriculum signal. Clarify it directly before moving on.";
  const activeResponseValue = stage === "baseline" ? freeformResponse : followUpResponse;
  const activeWordCount = stage === "baseline" ? getWordCount(freeformResponse) : getWordCount(followUpResponse);

  const activeRailItems = useMemo(
    () =>
      buildActiveRailItems({
        activeTopicLabel: activeTopic?.label ?? "Selected topic",
        stage,
        followUps,
        pendingFollowUp,
      }),
    [activeTopic?.label, followUps, pendingFollowUp, stage]
  );

  const resultsRailItems = useMemo(() => {
    if (!completedReport) {
      return [];
    }

    return buildLinearRailItems(
      [
        {
          id: "topic",
          label: "Topic selected",
          description: completedReport.topicLabel,
        },
        {
          id: "baseline",
          label: "Baseline answer",
          description: "Initial freeform explanation captured.",
        },
        ...completedReport.followUps.map((followUp, index) => ({
          id: followUp.id,
          label: `Follow-up ${index + 1}`,
          description: followUp.question,
        })),
        {
          id: "results",
          label: "Results",
          description: "Saved topic diagnostic summary.",
        },
      ],
      "results"
    );
  }, [completedReport]);

  const activeStepCount = useMemo(
    () => activeRailItems.filter((item) => item.state !== "locked").length,
    [activeRailItems]
  );
  const activeStepIndex = useMemo(() => {
    const currentIndex = activeRailItems.findIndex((item) => item.state === "current");
    return currentIndex >= 0 ? currentIndex + 1 : 1;
  }, [activeRailItems]);
  const activeCompletedCount = useMemo(
    () => activeRailItems.filter((item) => item.state === "completed").length,
    [activeRailItems]
  );
  const activeConfidence = analysis ? Math.round(analysis.confidence * 100) : 0;
  const activeRailSummary = useMemo(
    () => [
      {
        label: "Progress",
        value: `${activeStepIndex}/${activeStepCount || 1}`,
        tone: "accent" as const,
      },
      {
        label: "Answered",
        value: `${activeCompletedCount}`,
        tone: "default" as const,
      },
      ...(analysis
        ? [
            {
              label: "Confidence",
              value: `${activeConfidence}%`,
              tone: activeConfidence >= 70 ? ("success" as const) : ("warning" as const),
            },
          ]
        : []),
    ],
    [activeCompletedCount, activeConfidence, activeStepCount, activeStepIndex, analysis]
  );

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

  if (stage === "topic") {
    return (
      <DiagnosticTopicSelectionState
        topics={topics}
        previewTopicId={previewTopicId}
        setPreviewTopicId={setPreviewTopicId}
        startTopic={startTopic}
        error={error}
      />
    );
  }

  if (stage === "results" && completedReport) {
    return <DiagnosticResultsSummary report={completedReport} railItems={resultsRailItems} />;
  }

  if (!activeTopic || !activeDefinition) {
    return null;
  }

  const feedbackTitle =
    stage === "follow-up" && targetedPoint
      ? `Checking ${targetedPoint.pointId} ${targetedPoint.label}`
      : undefined;
  const feedbackSummary =
    stage === "follow-up" && targetedPoint
      ? getTargetedFeedbackSummary(targetedPoint)
      : undefined;

  return (
    <ActiveLearningLayout
      backHref="/revision"
      railTitle={`${activeTopic.label} diagnostic`}
      railSubtitle={activeDefinition.description}
      railIcon={<span className="text-lg">{activeTopic.icon}</span>}
      railItems={activeRailItems}
      railSummary={activeRailSummary}
      mobileSummaryLabel="Diagnostic steps"
      contextStrip={
        <TaskContextStrip
          eyebrow="Diagnostic"
          breadcrumb={`${activeTopic.label} - Step ${activeStepIndex} of ${activeStepCount || 1}`}
          meta={
            stage === "baseline"
              ? "Write one baseline explanation first. The system will only ask targeted follow-ups where coverage is still weak."
              : "One follow-up at a time. This step is only checking the missing evidence that still blocks a confident result."
          }
          status={
            <div className="flex flex-wrap justify-end gap-2">
              <Badge variant={stage === "baseline" ? "accent" : "warning"}>
                {stage === "baseline" ? "Baseline answer" : `Follow-up ${followUps.length + 1}`}
              </Badge>
              {analysis ? (
                <Badge variant={activeConfidence >= 70 ? "success" : "default"}>
                  {activeConfidence}% confidence
                </Badge>
              ) : null}
            </div>
          }
        />
      }
      task={
        <TaskPanel title={activePrompt} subtitle={activePromptDescription}>
          {stage === "follow-up" && targetedPoint ? (
            <div className="mt-5 rounded-2xl border border-warning/20 bg-warning/10 px-4 py-3">
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
          ) : null}
        </TaskPanel>
      }
      response={
        <TaskResponsePanel
          label={stage === "baseline" ? "Your baseline explanation" : "Your follow-up answer"}
          description={
            stage === "baseline"
              ? "Mention terms, links, processes, and examples where relevant. The diagnostic works best with a natural exam-style explanation."
              : "Answer only the missing concept or clarification this follow-up is asking for."
          }
        >
          {error ? <DiagnosticError error={error} /> : null}

          <textarea
            value={activeResponseValue}
            onChange={(event) => {
              if (stage === "baseline") {
                setFreeformResponse(event.target.value);
              } else {
                setFollowUpResponse(event.target.value);
              }
              setError("");
            }}
            rows={stage === "baseline" ? 12 : 8}
            placeholder={
              stage === "baseline"
                ? "Explain the topic in your own words. Mention terms, examples, design choices, and consequences where relevant."
                : "Add the missing concept, clarification, or example this follow-up is asking for."
            }
            className="mt-4 min-h-[220px] w-full rounded-[24px] border border-border bg-surface/40 px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
          />

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-muted-foreground/70">
              Deterministic matching against structured topic points, key terms, misconception rules, and follow-up history.
            </p>
            <p className="text-[11px] text-muted-foreground/50 tabular-nums">{activeWordCount} words</p>
          </div>
        </TaskResponsePanel>
      }
      feedback={
        stage === "follow-up" && targetedPoint ? (
          <TaskFeedbackPanel
            tone={targetedPoint.status === "misconception" ? "danger" : targetedPoint.status === "covered" ? "success" : "warning"}
            title={feedbackTitle}
            summary={feedbackSummary}
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Matched terms so far
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {targetedPoint.matchedTerms.length > 0 ? (
                    targetedPoint.matchedTerms.map((term) => (
                      <span
                        key={`${targetedPoint.pointId}-${term}`}
                        className="rounded-lg bg-success/10 px-2.5 py-1 text-[11px] text-success"
                      >
                        {term}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">No matched terms for this point yet.</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Still missing
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {targetedPoint.missingTerms.length > 0 ? (
                    targetedPoint.missingTerms.map((term) => (
                      <span
                        key={`${targetedPoint.pointId}-missing-${term}`}
                        className="rounded-lg bg-warning/10 px-2.5 py-1 text-[11px] text-warning"
                      >
                        {term}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">No major missing signals for this point.</span>
                  )}
                </div>
              </div>
            </div>
          </TaskFeedbackPanel>
        ) : undefined
      }
      primaryAction={{
        label:
          stage === "baseline"
            ? "Start diagnostic for this topic"
            : "Continue to next diagnostic check",
        onClick: () => void (stage === "baseline" ? runInitialAnalysis() : runFollowUp()),
        loading: isSubmitting,
      }}
      secondaryAction={
        stage === "follow-up" && analysis
          ? {
              label: "Finish diagnostic and view results",
              onClick: () => void persistAndShowResults(analysis),
              disabled: isSubmitting,
              variant: "secondary",
            }
          : {
              label: "Change topic",
              onClick: () => resetFlow(activeTopic.id),
              disabled: isSubmitting,
              variant: "secondary",
            }
      }
    />
  );
}
