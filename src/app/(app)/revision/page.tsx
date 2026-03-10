"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Clock,
  RotateCcw,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { DiagnosticWorkspace } from "@/components/revision/diagnostic-workspace";
import { getRecommendedMaterialCards } from "@/lib/content";
import {
  Badge,
  Button,
  Card,
  MaterialCard,
  ProgressBar,
} from "@/components/ui";
import { useAppData } from "@/components/providers/app-data-provider";
import {
  getTopicById,
  type DiagnosticPointStatus,
  type DiagnosticResult,
} from "@/lib/types";
import {
  formatRelativeTime,
  getWeakestTopics,
  hydrateMaterialsWithProgress,
  resolveMaterialTopicId,
} from "@/lib/progress";

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

function getScoreVariant(pct: number) {
  if (pct >= 75) return "success" as const;
  if (pct >= 45) return "warning" as const;
  return "danger" as const;
}

function getPointVariant(status: DiagnosticPointStatus) {
  if (status === "covered") return "success" as const;
  if (status === "partial") return "warning" as const;
  if (status === "misconception") return "danger" as const;
  return "default" as const;
}

function getPointLabel(status: DiagnosticPointStatus) {
  if (status === "covered") return "Covered well";
  if (status === "partial") return "Partially covered";
  if (status === "misconception") return "Misconception detected";
  return "Not assessed";
}

export default function RevisionPage() {
  const {
    activityHistory,
    diagnostic,
    revisionProgress,
    saveDiagnosticResult,
    trackMaterialProgress,
  } = useAppData();
  const [isRetaking, setIsRetaking] = useState(false);
  const [focusedTopicId, setFocusedTopicId] = useState<string | null>(null);
  const [justCompleted, setJustCompleted] = useState(false);
  const [pageError, setPageError] = useState("");

  async function handleDiagnosticComplete(result: DiagnosticResult) {
    await saveDiagnosticResult(result);
    setFocusedTopicId(result.latestTopicId ?? null);
    setIsRetaking(false);
    setJustCompleted(true);
    setTimeout(() => setJustCompleted(false), 5000);
  }

  if (!diagnostic || isRetaking) {
    return (
      <PageContainer size="lg">
        <div className="space-y-5">
          {diagnostic && (
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Revision diagnostic
                </p>
                <h1 className="text-2xl font-bold text-foreground">
                  Adaptive topic-first diagnostic
                </h1>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsRetaking(false)}>
                Back to coverage
              </Button>
            </div>
          )}

          <DiagnosticWorkspace
            diagnostic={diagnostic}
            onComplete={handleDiagnosticComplete}
          />
        </div>
      </PageContainer>
    );
  }

  const sortedTopics = [...diagnostic.topicScores].sort(
    (left, right) => left.score / left.maxScore - right.score / right.maxScore
  );
  const weakestTopics = getWeakestTopics(diagnostic, 3);
  const structuredReports = diagnostic.topicDiagnostics ?? [];
  const structuredTopicIds = new Set(
    structuredReports.map((report) => report.topicId)
  );
  const selectedTopicId =
    (focusedTopicId &&
    structuredReports.some((report) => report.topicId === focusedTopicId)
      ? focusedTopicId
      : diagnostic.latestTopicId) ??
    structuredReports[0]?.topicId ??
    null;
  const activeReport =
    structuredReports.find((report) => report.topicId === selectedTopicId) ??
    structuredReports[0] ??
    null;
  const activeTopicInfo = activeReport ? getTopicById(activeReport.topicId) : null;
  const coveredCount =
    activeReport?.curriculumPoints.filter((point) => point.status === "covered")
      .length ?? 0;
  const partialCount =
    activeReport?.curriculumPoints.filter((point) => point.status === "partial")
      .length ?? 0;
  const misconceptionCount =
    activeReport?.curriculumPoints.filter(
      (point) => point.status === "misconception"
    ).length ?? 0;
  const unassessedCount =
    activeReport?.curriculumPoints.filter((point) => point.status === "unassessed")
      .length ?? 0;
  const recentActivity = activityHistory.slice(0, 4);
  const structuredRecommendations = getRecommendedMaterialCards(
    activeReport
      ? [activeReport.topicId, ...weakestTopics.map((topic) => topic.category)]
      : weakestTopics.map((topic) => topic.category),
    6
  );
  const recommendedMaterials = activeReport?.recommendedMaterialIds?.length
    ? structuredRecommendations.filter((material) =>
        activeReport.recommendedMaterialIds.includes(material.id)
      )
    : structuredRecommendations.slice(0, 3);
  const displayMaterials = hydrateMaterialsWithProgress(
    recommendedMaterials.length > 0
      ? recommendedMaterials
      : structuredRecommendations.slice(0, 3),
    revisionProgress
  );

  async function handleMaterialProgress(materialId: string) {
    const material = displayMaterials.find((entry) => entry.id === materialId);

    if (!material) {
      return;
    }

    const topicId = resolveMaterialTopicId(material);

    if (!topicId) {
      setPageError("Unable to match this material to a topic.");
      return;
    }

    try {
      setPageError("");
      await trackMaterialProgress({
        materialId: material.id,
        title: material.title,
        topicId,
        activityType: material.type,
        currentProgressPercent: material.progress ?? 0,
        estimatedMinutes: material.estimatedMinutes,
      });
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Unable to update revision progress."
      );
    }
  }

  return (
    <PageContainer size="lg">
      <motion.div initial="hidden" animate="visible" className="space-y-6">
        {pageError && (
          <div className="flex items-center gap-2 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
            <AlertCircle size={14} className="shrink-0" />
            {pageError}
          </div>
        )}

        {justCompleted && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-success/20 bg-success/10 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/15">
                <CheckCircle2 size={16} className="text-success" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Adaptive diagnostic updated
                </p>
                <p className="text-xs text-muted-foreground">
                  The topic coverage map and next revision targets are ready.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          variants={fadeUp}
          custom={0}
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Revision diagnostic
            </p>
            <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
              Topic-first diagnostic coverage
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Freeform input, curriculum-point matching, targeted follow-ups, and
              coverage mapped back into the revision system.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsRetaking(true)}>
              <RotateCcw size={14} />
              Diagnose another topic
            </Button>
            {activeReport && (
              <Link
                href={`/revision/${activeReport.topicId}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-soft"
              >
                Open topic workspace
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </motion.div>

        <motion.div variants={fadeUp} custom={1} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Overall score
            </p>
            <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">
              {diagnostic.overallScore}%
            </p>
            <p className="mt-2 text-xs text-muted">
              Across all scored topics in the latest revision diagnostic snapshot.
            </p>
          </Card>

          <Card className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Topics scored
            </p>
            <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">
              {diagnostic.topicScores.length}
            </p>
            <p className="mt-2 text-xs text-muted">
              Structured coverage is available for {structuredReports.length} topic
              {structuredReports.length === 1 ? "" : "s"}.
            </p>
          </Card>

          <Card className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Latest confidence
            </p>
            <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">
              {activeReport ? Math.round(activeReport.confidence * 100) : 0}%
            </p>
            <p className="mt-2 text-xs text-muted">
              Confidence from freeform evidence, follow-up answers, and misconception checks.
            </p>
          </Card>

          <Card className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Next targets
            </p>
            <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">
              {activeReport?.suggestedNextTargets.length ?? weakestTopics.length}
            </p>
            <p className="mt-2 text-xs text-muted">
              Immediate revision priorities surfaced by the diagnostic engine.
            </p>
          </Card>
        </motion.div>

        <motion.div
          variants={fadeUp}
          custom={2}
          className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]"
        >
          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BrainCircuit size={15} className="text-accent" />
                <h2 className="text-sm font-semibold text-foreground">
                  Topic coverage index
                </h2>
              </div>
              <span className="text-xs text-muted-foreground">
                Structured topics can be opened below
              </span>
            </div>
            <div className="mt-4 space-y-2">
              {sortedTopics.map((topic) => {
                const pct = Math.round((topic.score / topic.maxScore) * 100);
                const topicInfo = getTopicById(topic.category);
                const hasStructuredCoverage = structuredTopicIds.has(topic.category);
                const isActive = activeReport?.topicId === topic.category;

                return (
                  <button
                    key={topic.category}
                    type="button"
                    onClick={() =>
                      hasStructuredCoverage
                        ? setFocusedTopicId(topic.category)
                        : undefined
                    }
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                      isActive
                        ? "border-accent/30 bg-accent/10"
                        : "border-border bg-surface/30 hover:border-accent/20 hover:bg-card"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-lg">
                        {topicInfo?.icon ?? "-"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {topic.topic}
                          </p>
                          <Badge variant={hasStructuredCoverage ? "success" : "warning"}>
                            {hasStructuredCoverage ? "Structured" : "Score only"}
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          <ProgressBar value={pct} size="sm" className="max-w-[180px]" />
                          <span className="text-xs font-medium tabular-nums text-muted-foreground">
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        className={hasStructuredCoverage ? "text-accent" : "text-muted-foreground"}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            {activeReport && activeTopicInfo ? (
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-2xl">
                    {activeTopicInfo.icon}
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Active report
                    </p>
                    <h2 className="text-xl font-semibold text-foreground">
                      {activeReport.topicLabel}
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      Latest mapped topic with pinned coverage and adaptive follow-up history.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Covered", value: coveredCount, tone: "success" as const },
                    { label: "Partial", value: partialCount, tone: "warning" as const },
                    { label: "Unassessed", value: unassessedCount, tone: "default" as const },
                    { label: "Misconceptions", value: misconceptionCount, tone: "danger" as const },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-border bg-surface/30 px-4 py-3"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {item.label}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-2xl font-bold tabular-nums text-foreground">
                          {item.value}
                        </span>
                        <Badge variant={item.tone}>{item.label}</Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Suggested next revision targets
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {activeReport.suggestedNextTargets.length > 0 ? (
                      activeReport.suggestedNextTargets.map((target) => (
                        <span
                          key={target}
                          className="rounded-xl border border-border bg-surface/40 px-3 py-2 text-xs text-foreground"
                        >
                          {target}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No urgent revision targets remain for this topic.
                      </span>
                    )}
                  </div>
                </div>

                {diagnostic.unassessedTopicIds && diagnostic.unassessedTopicIds.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Course topics not yet scored
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {diagnostic.unassessedTopicIds.map((topicId) => (
                        <span
                          key={topicId}
                          className="rounded-xl border border-border bg-surface/30 px-3 py-2 text-xs text-muted-foreground"
                        >
                          {getTopicById(topicId)?.label ?? topicId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-warning" />
                  <h2 className="text-sm font-semibold text-foreground">
                    Legacy diagnostic detected
                  </h2>
                </div>
                <p className="text-sm leading-relaxed text-muted">
                  This account still has score-only diagnostic data from the old
                  linear flow. Run a new topic diagnostic to unlock curriculum-point
                  coverage, adaptive follow-ups, and structured next targets.
                </p>
                <Button onClick={() => setIsRetaking(true)}>
                  Start new topic diagnostic
                  <ArrowRight size={14} />
                </Button>
              </div>
            )}
          </Card>
        </motion.div>

        {activeReport && (
          <motion.div
            variants={fadeUp}
            custom={3}
            className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]"
          >
            <Card className="p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <Target size={15} className="text-accent" />
                <h2 className="text-sm font-semibold text-foreground">
                  Curriculum point coverage
                </h2>
              </div>
              <div className="mt-5 space-y-3">
                {activeReport.curriculumPoints.map((point) => (
                  <div
                    key={point.pointId}
                    className="rounded-2xl border border-border bg-surface/20 px-4 py-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-accent">
                            {point.pointId}
                          </span>
                          <p className="text-sm font-semibold text-foreground">
                            {point.label}
                          </p>
                          <Badge variant={getPointVariant(point.status)}>
                            {getPointLabel(point.status)}
                          </Badge>
                        </div>
                        {point.notes && (
                          <p className="mt-2 text-xs leading-relaxed text-muted">
                            {point.notes}
                          </p>
                        )}
                      </div>

                      <div className="min-w-[180px] space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>Confidence</span>
                          <span>{Math.round(point.confidence * 100)}%</span>
                        </div>
                        <ProgressBar value={Math.round(point.confidence * 100)} size="sm" />
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
                            <span className="text-xs text-muted-foreground">
                              No clear matched terms.
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Missing terms
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
                            <span className="text-xs text-muted-foreground">
                              No major missing signals.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="space-y-4">
              <Card className="p-5">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-success" />
                  <h2 className="text-sm font-semibold text-foreground">
                    Key terms detected
                  </h2>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {activeReport.keyTermsMatched.length > 0 ? (
                    activeReport.keyTermsMatched.map((term) => (
                      <span
                        key={term}
                        className="rounded-lg bg-success/10 px-2.5 py-1 text-[11px] text-success"
                      >
                        {term}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No clear topic language was matched yet.
                    </p>
                  )}
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} className="text-danger" />
                  <h2 className="text-sm font-semibold text-foreground">
                    Adaptive follow-up trail
                  </h2>
                </div>
                <div className="mt-4 space-y-3">
                  {activeReport.followUps.length > 0 ? (
                    activeReport.followUps.map((followUp) => (
                      <div
                        key={followUp.id}
                        className="rounded-2xl border border-border bg-surface/30 px-3 py-3"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          {followUp.targetedPointId} - {followUp.reason}
                        </p>
                        <p className="mt-1 text-sm font-medium text-foreground">
                          {followUp.question}
                        </p>
                        <p className="mt-2 text-xs leading-relaxed text-muted">
                          {followUp.answer}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No follow-ups were needed for this topic run.
                    </p>
                  )}
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        <motion.div variants={fadeUp} custom={4}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className="text-accent" />
              <h2 className="text-sm font-semibold text-foreground">
                Recommended next materials
              </h2>
            </div>
            <span className="text-xs text-muted-foreground">
              Filtered from current diagnostic targets
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {displayMaterials.map((material, index) => (
              <MaterialCard
                key={material.id}
                data={material}
                index={index}
                onClick={() => void handleMaterialProgress(material.id)}
              />
            ))}
          </div>
        </motion.div>

        <motion.div variants={fadeUp} custom={5} className="grid gap-4 xl:grid-cols-2">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                Recent activity
              </h2>
            </div>
            <div className="mt-4 space-y-2">
              {recentActivity.length > 0 ? (
                recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface/30 px-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-foreground">{item.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatRelativeTime(item.occurredAt)}
                      </p>
                    </div>
                    <Badge variant="default">{item.minutesSpent}m</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">No recent activity yet.</p>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Target size={15} className="text-warning" />
              <h2 className="text-sm font-semibold text-foreground">
                Weakest scored topics
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              {weakestTopics.map((topic) => {
                const pct = Math.round((topic.score / topic.maxScore) * 100);
                return (
                  <div key={topic.category} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-foreground">
                        {topic.topic}
                      </span>
                      <Badge variant={getScoreVariant(pct)}>{pct}%</Badge>
                    </div>
                    <ProgressBar value={pct} size="sm" />
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
