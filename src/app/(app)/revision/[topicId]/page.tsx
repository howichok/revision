"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  FileQuestion,
  ClipboardList,
  Target,
  TrendingUp,
  LayoutList,
  Key,
} from "lucide-react";
import { Button, Card, CardContent, ProgressBar, Badge } from "@/components/ui";
import { PageContainer } from "@/components/layout/page-container";
import { storage } from "@/lib/storage";
import { getTopicById, getTopicTree, TOPICS } from "@/lib/types";
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
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const topicInfo = getTopicById(topicId);
  const tree = getTopicTree(topicId);
  const diagnostic = storage.getDiagnostic();
  const topicScore = diagnostic?.topicScores.find((s) => s.category === topicId);
  const pct = topicScore ? Math.round((topicScore.score / topicScore.maxScore) * 100) : 0;

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

  const allKeywords = tree.subtopics.flatMap((s) => s.keywords);

  return (
    <PageContainer className="max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-6"
      >
        {/* Header */}
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
              <Badge variant={getScoreVariant(pct)} className="text-sm">{pct}%</Badge>
              <ProgressBar value={pct} className="w-24" size="sm" />
            </div>
          )}
        </div>

        {/* Tabs */}
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

        {/* Tab content */}
        <Card>
          <CardContent className="p-6 min-h-[320px]">
            {activeTab === "overview" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{tree.description}</p>
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Subtopics in this topic</h3>
                  <ul className="space-y-1">
                    {tree.subtopics.map((s) => (
                      <li key={s.id} className="text-sm text-foreground flex items-center gap-2">
                        <span className="text-muted-foreground font-mono text-xs">{s.id}</span>
                        {s.label}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "subtopics" && (
              <div className="space-y-3">
                {tree.subtopics.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 rounded-xl border border-border bg-surface/30 hover:bg-surface/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-xs text-accent">{sub.id}</span>
                      <h4 className="font-semibold text-sm text-foreground">{sub.label}</h4>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {sub.keywords.slice(0, 8).map((kw) => (
                        <span key={kw} className="px-2 py-0.5 rounded-md bg-card border border-border text-[11px] text-muted-foreground">
                          {kw}
                        </span>
                      ))}
                      {sub.keywords.length > 8 && (
                        <span className="text-[11px] text-muted-foreground">+{sub.keywords.length - 8} more</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "key-terms" && (
              <div className="flex flex-wrap gap-2">
                {allKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-foreground hover:border-accent/20 transition-colors"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}

            {activeTab === "practice" && (
              <div className="text-center py-12">
                <ClipboardList size={40} className="text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground mb-2">Practice questions for this topic</p>
                <p className="text-xs text-muted-foreground/70">Coming soon — practice sets will appear here.</p>
              </div>
            )}

            {activeTab === "exam-questions" && (
              <div className="text-center py-12">
                <FileQuestion size={40} className="text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground mb-2">Past exam-style questions</p>
                <p className="text-xs text-muted-foreground/70">Coming soon — exam questions will appear here.</p>
              </div>
            )}

            {activeTab === "weak-areas" && (
              <div className="space-y-3">
                {diagnostic ? (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Based on your diagnostic, focus on these subtopics to improve your score.
                    </p>
                    {tree.subtopics.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl bg-surface/50 border border-border">
                        <span className="text-sm font-medium text-foreground">{sub.label}</span>
                        <Badge variant="default">Review</Badge>
                      </div>
                    ))}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Complete the diagnostic to see your weak areas here.</p>
                )}
              </div>
            )}

            {activeTab === "progress" && (
              <div className="space-y-4">
                {diagnostic ? (
                  <>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-surface/50 border border-border">
                      <div className="text-3xl font-bold text-foreground">{pct}%</div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Diagnostic score for {topicInfo.label}</p>
                        <ProgressBar value={pct} className="w-full" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Topic-level progress and history will appear here as you revise.</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Complete the diagnostic to see your progress for this topic.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </PageContainer>
  );
}
