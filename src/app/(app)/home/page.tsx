"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  BookOpen,
  Library,
  Target,
  Zap,
  Clock,
  ArrowRight,
  Flame,
  TrendingUp,
  Star,
  MapPin,
  BarChart3,
  ClipboardCheck,
  Play,
} from "lucide-react";
import { useAppData } from "@/components/providers/app-data-provider";
import {
  Button,
  Card,
  Badge,
  ProgressBar,
  ProgressRing,
  WeekActivity,
  MaterialCard,
} from "@/components/ui";
import { PageContainer } from "@/components/layout/page-container";
import { getRecommendedMaterialCards } from "@/lib/content";
import {
  getTopicLabel,
  getTopicById,
} from "@/lib/types";
import {
  formatRelativeTime,
  getRevisitQueue,
  getStudiedTopicCount,
  getThisWeekMinutes,
  hydrateMaterialsWithProgress,
  resolveMaterialTopicId,
  getWeakestTopics,
  getWeekActivity,
} from "@/lib/progress";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

function getLondonGreeting(): { greeting: string; tzLabel: string } {
  const now = new Date();
  const londonHour = parseInt(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      hour: "numeric",
      hour12: false,
    }).format(now),
    10
  );
  const tzName =
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      timeZoneName: "short",
    })
      .formatToParts(now)
      .find((p) => p.type === "timeZoneName")?.value || "GMT";
  const greeting =
    londonHour < 12 ? "Morning" : londonHour < 18 ? "Afternoon" : "Evening";
  return { greeting, tzLabel: `London \u00b7 ${tzName}` };
}

const activityTypeIcon = {
  review: BookOpen,
  practice: Target,
  notes: BookOpen,
  flashcards: Zap,
  guide: Zap,
  video: Play,
  diagnostic: ClipboardCheck,
  onboarding: Target,
};

export default function HomePage() {
  const {
    activityHistory,
    diagnostic,
    isHydrating,
    onboarding,
    revisionProgress,
    trackMaterialProgress,
    user,
  } = useAppData();
  const [pageError, setPageError] = useState("");

  if (isHydrating && !user) {
    return (
      <PageContainer size="lg">
        <div className="h-48" />
      </PageContainer>
    );
  }

  if (!user) return null;

  const hasDiagnostic = !!diagnostic;
  const { greeting, tzLabel } = getLondonGreeting();

  const weakestTopics = getWeakestTopics(diagnostic, 3);
  const weekActivity = getWeekActivity(activityHistory);
  const totalSessions = activityHistory.length;
  const minutesThisWeek = getThisWeekMinutes(activityHistory);
  const hoursThisWeek =
    minutesThisWeek > 0 ? `${(minutesThisWeek / 60).toFixed(1)}h` : "\u2014";
  const topicsCovered = getStudiedTopicCount(diagnostic);
  const recentActivity = activityHistory.slice(0, 4);
  const revisitQueue = getRevisitQueue(
    diagnostic,
    onboarding,
    revisionProgress,
    activityHistory,
    3
  );
  const nextQueueItem = revisitQueue[0] ?? null;
  const recommendedMaterials = hydrateMaterialsWithProgress(
    getRecommendedMaterialCards(
      revisitQueue.length > 0
        ? revisitQueue.map((topic) => topic.topicId)
        : weakestTopics.map((topic) => topic.category),
      3
    ),
    revisionProgress
  );

  async function handleMaterialProgress(materialId: string) {
    const material = recommendedMaterials.find((entry) => entry.id === materialId);

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
          : "Unable to update your revision progress."
      );
    }
  }

  return (
    <PageContainer size="lg">
      <motion.div initial="hidden" animate="visible" className="space-y-6">
        {pageError && (
          <div className="flex items-center gap-2 text-sm text-danger bg-danger/10 rounded-lg px-3 py-2.5">
            <AlertCircle size={14} className="shrink-0" />
            {pageError}
          </div>
        )}

        {/* ─── Greeting bar with streak ─── */}
        <motion.div variants={fadeUp} custom={0}>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-5">
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <MapPin size={10} className="text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">{tzLabel}</span>
                </div>
                <div className="w-px h-3 bg-border" />
                <div className="flex items-center gap-1.5">
                  <Flame size={11} className="text-accent" />
                  <span className="text-[11px] font-medium text-accent">3 day streak</span>
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                {greeting}, {user.nickname}
              </h1>
              <p className="text-muted text-sm mt-0.5">
                {hasDiagnostic
                  ? "Here\u2019s where you\u2019re at. Keep going."
                  : "Let\u2019s get your revision sorted."}
              </p>
            </div>
          </div>

          {/* ─── Row 1: Top metrics strip ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Overall */}
            <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center text-center card-interactive">
              <ProgressRing
                value={hasDiagnostic ? diagnostic.overallScore : 0}
                size={56}
                strokeWidth={5}
              />
              <p className="text-[11px] text-muted-foreground font-medium tracking-wide uppercase mt-2">Overall</p>
            </div>

            {/* Study Time */}
            <div className="bg-card border border-border rounded-2xl p-4 card-interactive">
              <div className="flex items-center gap-1.5 mb-3">
                <Clock size={12} className="text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground font-medium tracking-wide uppercase">Study Time</span>
              </div>
              <p className="text-2xl font-bold leading-none tabular-nums">
                {hasDiagnostic ? hoursThisWeek : "\u2014"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">this week</p>
            </div>

            {/* Topics */}
            <div className="bg-card border border-border rounded-2xl p-4 card-interactive">
              <div className="flex items-center gap-1.5 mb-3">
                <Target size={12} className="text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground font-medium tracking-wide uppercase">Topics</span>
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-bold leading-none tabular-nums">
                  {hasDiagnostic ? topicsCovered : "\u2014"}
                </p>
                {hasDiagnostic && <span className="text-sm text-muted-foreground font-medium">/ 8</span>}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">covered</p>
            </div>

            {/* This Week */}
            <div className="bg-card border border-border rounded-2xl p-4 card-interactive">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <BarChart3 size={12} className="text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground font-medium tracking-wide uppercase">This Week</span>
                </div>
                <span className="text-[11px] text-muted-foreground tabular-nums">{totalSessions} sessions</span>
              </div>
              <div className="overflow-hidden">
                <WeekActivity data={weekActivity} className="h-9" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── Row 2: Next Step — hero CTA ─── */}
        <motion.div variants={fadeUp} custom={1}>
          <Card hover className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-accent/4 via-transparent to-transparent" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
                  <Zap size={22} className="text-accent" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-base mb-0.5">Next Step</h3>
                  <p className="text-sm text-muted leading-relaxed">
                    {hasDiagnostic && nextQueueItem
                      ? `${nextQueueItem.topicLabel} is due next. ${nextQueueItem.nextAction}.`
                      : hasDiagnostic && weakestTopics[0]
                        ? `Focus on ${weakestTopics[0].topic} \u2014 your weakest area at ${Math.round((weakestTopics[0].score / weakestTopics[0].maxScore) * 100)}%.`
                      : "Run the diagnostic test so we can build your personalised revision plan."}
                  </p>
                </div>
              </div>
              <Link
                href={
                  nextQueueItem
                    ? `/revision/${nextQueueItem.topicId}?tab=practice`
                    : "/revision"
                }
                className="shrink-0"
              >
                <Button size="sm" className="group">
                  {hasDiagnostic ? "Continue Revision" : "Start Diagnostic"}
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>

        {hasDiagnostic && revisitQueue.length > 0 && (
          <motion.div variants={fadeUp} custom={2}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Target size={15} className="text-accent" />
                <h3 className="text-sm font-semibold">Revisit Queue</h3>
              </div>
              <span className="text-xs text-muted-foreground">
                Ranked by weakness, practice gaps, and recency
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {revisitQueue.map((item) => (
                <Link
                  key={item.topicId}
                  href={`/revision/${item.topicId}?tab=practice`}
                  className="group"
                >
                  <Card hover className="h-full">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{item.topicIcon}</span>
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

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-border bg-surface/30 px-3 py-3">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                          Practice
                        </p>
                        <p className="mt-2 text-lg font-semibold text-foreground">
                          {item.practicePercent}%
                        </p>
                      </div>
                      <div className="rounded-xl border border-border bg-surface/30 px-3 py-3">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                          Diagnostic
                        </p>
                        <p className="mt-2 text-lg font-semibold text-foreground">
                          {item.diagnosticPercent ?? "\u2014"}%
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {item.reasons.map((reason) => (
                        <div
                          key={`${item.topicId}-${reason}`}
                          className="rounded-xl border border-border bg-surface/20 px-3 py-2 text-xs text-muted-foreground"
                        >
                          {reason}
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center gap-1 text-xs font-medium text-accent">
                      {item.nextAction}
                      <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* ─── Row 3: Revision + Library ─── */}
        <motion.div variants={fadeUp} custom={hasDiagnostic ? 3 : 2} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/revision" className="group">
            <Card hover className="h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/4 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
                  <BookOpen size={18} className="text-accent" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Revision</h3>
                <p className="text-xs text-muted mb-3">
                  {hasDiagnostic ? "Pick up where you left off" : "Take the diagnostic to start"}
                </p>
                <div className="flex items-center gap-1 text-xs text-accent font-medium">
                  {hasDiagnostic ? "Continue" : "Start"}
                  <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/library" className="group">
            <Card hover className="h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/4 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
                  <Library size={18} className="text-accent" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Library</h3>
                <p className="text-xs text-muted mb-3">Past papers, notes, and resources</p>
                <div className="flex items-center gap-1 text-xs text-accent font-medium">
                  Browse
                  <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Card>
          </Link>
        </motion.div>

        {/* ─── Post-diagnostic: Recommended materials (before Focus/Weakest) ─── */}
        {hasDiagnostic && (
          <motion.div variants={fadeUp} custom={4}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Star size={15} className="text-accent" />
                <h3 className="text-sm font-semibold">Recommended for You</h3>
              </div>
              <Link href="/revision" className="text-xs text-accent hover:text-accent/80 transition-colors">
                View all
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedMaterials.map((material, i) => (
                <MaterialCard
                  key={material.id}
                  data={material}
                  index={i}
                  onClick={() => void handleMaterialProgress(material.id)}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* ─── Post-diagnostic: Recent Activity ─── */}
        {hasDiagnostic && (
          <motion.div variants={fadeUp} custom={5}>
            <div className="bg-card border border-border rounded-2xl p-5 card-interactive">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={15} className="text-muted-foreground" />
                <h3 className="text-sm font-semibold">Recent Activity</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">
                {recentActivity.map((item) => {
                  const Icon = activityTypeIcon[item.type as keyof typeof activityTypeIcon] || BookOpen;
                  return (
                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface transition-colors">
                      <div className="w-7 h-7 rounded-lg bg-surface flex items-center justify-center shrink-0">
                        <Icon size={13} className="text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground truncate">{item.title}</p>
                        <p className="text-[10px] text-muted-foreground">{formatRelativeTime(item.occurredAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── Row 4: Focus Topics + Weakest Areas (secondary) ─── */}
        <motion.div variants={fadeUp} custom={hasDiagnostic ? 6 : 3} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-2xl p-5 card-interactive">
            <div className="flex items-center gap-2 mb-3">
              <Target size={15} className="text-accent" />
              <h3 className="text-sm font-semibold">Focus Topics</h3>
            </div>
            {onboarding && onboarding.weakAreas.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {onboarding.weakAreas.map((area) => {
                  const topic = getTopicById(area);
                  return (
                    <span
                      key={area}
                      className="px-2.5 py-1.5 bg-accent/10 text-accent text-xs font-medium rounded-lg flex items-center gap-1.5"
                    >
                      {topic?.icon && <span>{topic.icon}</span>}
                      {getTopicLabel(area)}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted">No focus topics set yet.</p>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 card-interactive">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={15} className="text-warning" />
              <h3 className="text-sm font-semibold">Weakest Areas</h3>
            </div>
            {hasDiagnostic ? (
              <div className="space-y-2.5">
                {weakestTopics.map((topic) => {
                  const pct = Math.round((topic.score / topic.maxScore) * 100);
                  return (
                    <div key={topic.topic} className="flex items-center gap-3">
                      <span className="text-xs text-foreground w-28 shrink-0 truncate">{topic.topic}</span>
                      <ProgressBar value={pct} className="flex-1" />
                      <Badge variant={pct >= 50 ? "warning" : "danger"} className="w-11 justify-center text-[10px]">
                        {pct}%
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted">Run the diagnostic to see your weakest areas.</p>
            )}
          </div>
        </motion.div>

        {/* ─── Pre-diagnostic: Recent Activity at bottom ─── */}
        {!hasDiagnostic && (
          <motion.div variants={fadeUp} custom={4}>
            <div className="bg-card border border-border rounded-2xl p-5 card-interactive">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={15} className="text-muted-foreground" />
                <h3 className="text-sm font-semibold">Recent Activity</h3>
              </div>
              <p className="text-xs text-muted">No activity yet. Start your first revision session!</p>
            </div>
          </motion.div>
        )}

      </motion.div>
    </PageContainer>
  );
}
