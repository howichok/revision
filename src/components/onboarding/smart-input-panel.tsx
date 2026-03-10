"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUp,
  Sparkles,
  ArrowRight,
  Plus,
  Search,
  MessageSquare,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TOPIC_TREES, TOPICS } from "@/lib/types";
import type { TopicTree, Subtopic } from "@/lib/types";

/* ─── Types ─── */

interface SmartInputPanelProps {
  activeTree: TopicTree | null;
  topicLabel: string;
  topicIcon: string;
  selectedSubtopics: string[];
  onSubtopicToggle: (subtopicId: string) => void;
  freeText: string;
  onFreeTextChange: (text: string) => void;
  weakAreas?: string[];
  onAutoTopicAdd?: (topicId: string) => void;
  onGlobalMatchSelect?: (topicId: string, subtopicId: string) => void;
}

interface SuggestionMatch {
  subtopic: Subtopic;
  matchedKeywords: string[];
  confidence: "high" | "medium" | "low";
}

interface GlobalMatch {
  topicId: string;
  topicLabel: string;
  topicIcon: string;
  subtopic: Subtopic;
  matchedKeywords: string[];
  confidence: "high" | "medium" | "low";
}

interface CrossTopicDetection {
  topicId: string;
  topicLabel: string;
  topicIcon: string;
  matchedKeywords: string[];
  confidence: "high" | "medium" | "low";
}

interface SentQuery {
  id: string;
  text: string;
  topicLabel: string;
  matches: SuggestionMatch[];
  globalMatches?: GlobalMatch[];
  bestTopic?: { topicId: string; topicLabel: string; topicIcon: string; matchCount: number } | null;
  crossTopicDetection?: CrossTopicDetection;
  timestamp: number;
}

/* ─── Matching logic ─── */

function normaliseTerms(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

function findMatches(tree: TopicTree, query: string): SuggestionMatch[] {
  const terms = normaliseTerms(query);
  if (terms.length === 0) return [];

  const matches: SuggestionMatch[] = [];
  for (const sub of tree.subtopics) {
    const matched: string[] = [];
    for (const term of terms) {
      for (const kw of sub.keywords) {
        const kwLower = kw.toLowerCase();
        if (
          kwLower.includes(term) ||
          (term.length >= 2 && kwLower.startsWith(term))
        ) {
          if (!matched.includes(kw)) matched.push(kw);
        }
      }
      if (
        sub.label.toLowerCase().includes(term) ||
        (term.length >= 2 && sub.label.toLowerCase().startsWith(term))
      ) {
        if (!matched.includes(sub.label)) matched.push(sub.label);
      }
    }
    if (matched.length > 0) {
      const confidence =
        matched.length >= 3 ? "high" : matched.length >= 2 ? "medium" : "low";
      matches.push({ subtopic: sub, matchedKeywords: matched, confidence });
    }
  }

  return matches.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.confidence] - order[b.confidence];
  });
}

function findCrossTopicMatch(
  activeTopicId: string,
  weakAreas: string[],
  query: string
): CrossTopicDetection | null {
  const terms = normaliseTerms(query);
  if (terms.length === 0) return null;

  let bestMatch: CrossTopicDetection | null = null;
  let bestCount = 0;

  for (const tree of TOPIC_TREES) {
    if (tree.topicId === activeTopicId || weakAreas.includes(tree.topicId)) continue;

    const matchedKeywords: string[] = [];
    for (const sub of tree.subtopics) {
      for (const term of terms) {
        for (const kw of sub.keywords) {
          if (
            (kw.toLowerCase().includes(term) ||
              term.includes(kw.toLowerCase().slice(0, 4))) &&
            !matchedKeywords.includes(kw)
          ) {
            matchedKeywords.push(kw);
          }
        }
      }
    }

    if (matchedKeywords.length >= 2 && matchedKeywords.length > bestCount) {
      const topicInfo = TOPICS.find((t) => t.id === tree.topicId);
      bestCount = matchedKeywords.length;
      bestMatch = {
        topicId: tree.topicId,
        topicLabel: topicInfo?.label ?? tree.topicId,
        topicIcon: topicInfo?.icon ?? "",
        matchedKeywords,
        confidence: matchedKeywords.length >= 4 ? "high" : "medium",
      };
    }
  }

  return bestMatch;
}

function findGlobalMatches(query: string): {
  matches: GlobalMatch[];
  bestTopic: {
    topicId: string;
    topicLabel: string;
    topicIcon: string;
    matchCount: number;
  } | null;
} {
  const terms = normaliseTerms(query);
  if (terms.length === 0) return { matches: [], bestTopic: null };

  const matches: GlobalMatch[] = [];
  const topicCounts: Record<string, { label: string; icon: string; count: number }> = {};

  for (const tree of TOPIC_TREES) {
    const topicInfo = TOPICS.find((t) => t.id === tree.topicId);

    for (const sub of tree.subtopics) {
      const matched: string[] = [];
      for (const term of terms) {
        for (const kw of sub.keywords) {
          const kwLower = kw.toLowerCase();
          if (
            kwLower.includes(term) ||
            term.includes(kwLower.slice(0, Math.max(3, kwLower.length - 1)))
          ) {
            if (!matched.includes(kw)) matched.push(kw);
          }
        }
        if (sub.label.toLowerCase().includes(term)) {
          if (!matched.includes(sub.label)) matched.push(sub.label);
        }
        if (topicInfo && topicInfo.label.toLowerCase().includes(term)) {
          if (!matched.includes(topicInfo.label)) matched.push(topicInfo.label);
        }
      }

      if (matched.length > 0) {
        const confidence =
          matched.length >= 3 ? "high" : matched.length >= 2 ? "medium" : "low";
        matches.push({
          topicId: tree.topicId,
          topicLabel: topicInfo?.label ?? tree.topicId,
          topicIcon: topicInfo?.icon ?? "",
          subtopic: sub,
          matchedKeywords: matched,
          confidence,
        });

        if (!topicCounts[tree.topicId]) {
          topicCounts[tree.topicId] = {
            label: topicInfo?.label ?? tree.topicId,
            icon: topicInfo?.icon ?? "",
            count: 0,
          };
        }
        topicCounts[tree.topicId].count += matched.length;
      }
    }
  }

  let bestTopic: {
    topicId: string;
    topicLabel: string;
    topicIcon: string;
    matchCount: number;
  } | null = null;
  let bestCount = 0;
  for (const [topicId, info] of Object.entries(topicCounts)) {
    if (info.count > bestCount) {
      bestCount = info.count;
      bestTopic = {
        topicId,
        topicLabel: info.label,
        topicIcon: info.icon,
        matchCount: info.count,
      };
    }
  }

  return {
    matches: matches.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      if (order[a.confidence] !== order[b.confidence])
        return order[a.confidence] - order[b.confidence];
      return b.matchedKeywords.length - a.matchedKeywords.length;
    }),
    bestTopic,
  };
}

function getSmartSuggestions(
  query: string,
  isGlobalMode: boolean,
  activeTree: TopicTree | null
): string[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const out: string[] = [];
  if (isGlobalMode) {
    for (const t of TOPICS) {
      if (t.id === "esp") continue;
      const label = t.label.toLowerCase();
      if (
        label.includes(q) ||
        q.includes(label.slice(0, 4)) ||
        label
          .split(/\s+/)
          .some((w) => w.startsWith(q) || q.startsWith(w.slice(0, 2)))
      ) {
        out.push(t.label);
      }
    }
    if (out.length === 0) {
      const first = q.slice(0, 2);
      for (const t of TOPICS) {
        if (t.id === "esp") continue;
        if (
          t.label.toLowerCase().includes(first) ||
          t.label.toLowerCase().startsWith(first)
        )
          out.push(t.label);
      }
    }
    if (out.length > 4) return out.slice(0, 4);
    if (out.length > 0) return out;
    return TOPICS.filter((t) => t.id !== "esp")
      .slice(0, 4)
      .map((t) => t.label);
  }

  if (activeTree) {
    const seen = new Set<string>();
    for (const sub of activeTree.subtopics) {
      for (const kw of sub.keywords) {
        const kwLower = kw.toLowerCase();
        if (
          kwLower.includes(q) ||
          q.includes(kwLower.slice(0, 3)) ||
          kwLower.startsWith(q)
        ) {
          if (!seen.has(kw)) {
            seen.add(kw);
            out.push(kw);
          }
        }
      }
      if (sub.label.toLowerCase().includes(q) && !seen.has(sub.label)) {
        seen.add(sub.label);
        out.push(sub.label);
      }
    }
    if (out.length > 5) return out.slice(0, 5);
    if (out.length > 0) return out;
    activeTree.subtopics
      .slice(0, 3)
      .flatMap((s) => s.keywords.slice(0, 2))
      .forEach((kw) => {
        if (!out.includes(kw)) out.push(kw);
      });
  }
  return out.slice(0, 5);
}

/* ─── Constants ─── */

const SAMPLE_QUERIES = [
  "SQL and databases",
  "encryption, firewalls",
  "decomposition, flowcharts",
  "loops and variables",
  "GDPR, data protection",
  "phishing, social engineering",
];

const CONFIDENCE_STYLES = {
  high: { bg: "bg-success/10 border-success/20", text: "text-success", dot: "bg-success" },
  medium: { bg: "bg-warning/10 border-warning/20", text: "text-warning", dot: "bg-warning" },
  low: { bg: "bg-muted-foreground/10 border-border", text: "text-muted-foreground", dot: "bg-muted-foreground" },
};

/* ─── Component ─── */

export function SmartInputPanel({
  activeTree,
  topicLabel,
  topicIcon,
  selectedSubtopics,
  onSubtopicToggle,
  freeText,
  onFreeTextChange,
  weakAreas = [],
  onAutoTopicAdd,
  onGlobalMatchSelect,
}: SmartInputPanelProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [sentQueries, setSentQueries] = useState<SentQuery[]>([]);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isGlobalMode = !activeTree;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sentQueries]);

  const handleSend = useCallback(() => {
    if (!freeText.trim() || isSending) return;

    const queryText = freeText.trim();
    setIsSending(true);

    setTimeout(() => {
      let matches: SuggestionMatch[] = [];
      let globalMatchesResult: GlobalMatch[] | undefined;
      let bestTopicResult: {
        topicId: string;
        topicLabel: string;
        topicIcon: string;
        matchCount: number;
      } | null = null;
      let crossTopicDetection: CrossTopicDetection | undefined;

      if (activeTree) {
        matches = findMatches(activeTree, queryText);
        if (onAutoTopicAdd) {
          const detected = findCrossTopicMatch(
            activeTree.topicId,
            weakAreas,
            queryText
          );
          if (detected) {
            crossTopicDetection = detected;
            onAutoTopicAdd(detected.topicId);
          }
        }
      } else {
        const result = findGlobalMatches(queryText);
        globalMatchesResult = result.matches;
        bestTopicResult = result.bestTopic;
        if (
          bestTopicResult &&
          bestTopicResult.matchCount >= 2 &&
          onAutoTopicAdd &&
          !weakAreas.includes(bestTopicResult.topicId)
        ) {
          onAutoTopicAdd(bestTopicResult.topicId);
        }
      }

      const newQuery: SentQuery = {
        id: `q-${Date.now()}`,
        text: queryText,
        topicLabel: activeTree ? topicLabel : "All Topics",
        matches,
        globalMatches: globalMatchesResult,
        bestTopic: bestTopicResult,
        crossTopicDetection,
        timestamp: Date.now(),
      };
      setSentQueries((prev) => {
        const next = [...prev, newQuery];
        return next.length > 100 ? next.slice(-100) : next;
      });

      setTimeout(() => {
        onFreeTextChange("");
        setTimeout(() => setIsSending(false), 200);
      }, 80);
    }, 400);
  }, [
    freeText,
    activeTree,
    topicLabel,
    isSending,
    onFreeTextChange,
    weakAreas,
    onAutoTopicAdd,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const hasText = freeText.trim().length > 0;

  const placeholderText = isGlobalMode
    ? "Describe what you\u2019re struggling with\u2026"
    : `What feels confusing about ${topicLabel.toLowerCase()}?`;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTree?.topicId ?? "global"}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ type: "spring", stiffness: 400, damping: 32, mass: 0.8 }}
        className="flex flex-col h-full max-h-full min-h-0 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden"
      >
        {/* ── Panel header ── */}
        <div className="px-5 pt-5 pb-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                activeTree
                  ? "bg-surface border border-border"
                  : "bg-accent/10 border border-accent/20"
              )}
            >
              {activeTree ? (
                <span className="text-sm">{topicIcon}</span>
              ) : (
                <Search size={14} className="text-accent" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {activeTree ? topicLabel : "Smart Search"}
              </h3>
              <p className="text-[11px] text-muted-foreground truncate">
                {activeTree
                  ? "Describe what feels confusing"
                  : "Type anything \u2014 we\u2019ll match it to topics"}
              </p>
            </div>
            {sentQueries.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface border border-border">
                <MessageSquare size={10} className="text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                  {sentQueries.length}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Results / empty state ── */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 px-5 py-4"
        >
          {/* Empty state */}
          {sentQueries.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="flex flex-col gap-5"
            >
              {/* Empty illustration */}
              <div className="flex flex-col items-center text-center py-4">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-14 h-14 rounded-2xl bg-accent/8 border border-accent/15 flex items-center justify-center mb-4"
                >
                  <Sparkles size={22} className="text-accent/60" />
                </motion.div>
                <p className="text-sm font-medium text-foreground/80 mb-1">
                  {activeTree ? "What\u2019s tricky?" : "What are you struggling with?"}
                </p>
                <p className="text-[11px] text-muted-foreground max-w-[260px]">
                  {activeTree
                    ? "Type a keyword or describe what confuses you and we\u2019ll find matching subtopics."
                    : "Describe your confusion in plain English. We\u2019ll scan all topics and find what matches."}
                </p>
              </div>

              {/* Quick-start chips */}
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2.5">
                  {activeTree ? "Try these keywords" : "Quick start"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {activeTree
                    ? activeTree.subtopics
                        .slice(0, 4)
                        .flatMap((s) => s.keywords.slice(0, 2))
                        .slice(0, 6)
                        .map((kw) => (
                          <motion.button
                            key={kw}
                            whileHover={{ scale: 1.03, y: -1 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() =>
                              onFreeTextChange(freeText ? `${freeText}, ${kw}` : kw)
                            }
                            className="px-3 py-1.5 rounded-full text-[11px] font-medium text-muted-foreground bg-surface border border-border/60 hover:border-accent/30 hover:text-foreground hover:bg-accent/5 transition-colors cursor-pointer"
                          >
                            {kw}
                          </motion.button>
                        ))
                    : SAMPLE_QUERIES.map((sq) => (
                        <motion.button
                          key={sq}
                          whileHover={{ scale: 1.03, y: -1 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => onFreeTextChange(sq)}
                          className="px-3 py-1.5 rounded-full text-[11px] font-medium text-muted-foreground bg-surface border border-border/60 hover:border-accent/30 hover:text-foreground hover:bg-accent/5 transition-colors cursor-pointer"
                        >
                          {sq}
                        </motion.button>
                      ))}
                </div>
              </div>

              {/* Global mode topic pills */}
              {isGlobalMode && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2.5">
                    Browse by topic
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TOPICS.slice(0, 8).map((t, i) => (
                      <motion.button
                        key={t.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 + i * 0.03 }}
                        whileHover={{ scale: 1.04, y: -1 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => onFreeTextChange(t.label)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium text-muted-foreground bg-surface border border-border/60 hover:border-accent/30 hover:text-foreground hover:bg-accent/5 transition-colors cursor-pointer"
                      >
                        <span className="text-xs">{t.icon}</span>
                        {t.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Conversation thread ── */}
          <div className="space-y-5">
            <AnimatePresence>
              {sentQueries.map((query) => (
                <motion.div
                  key={query.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 30,
                  }}
                  className="space-y-3"
                >
                  {/* User message bubble */}
                  <div className="flex justify-end">
                    <div className="max-w-[80%]">
                      <div className="bg-accent/10 border border-accent/20 rounded-2xl rounded-br-md px-4 py-3">
                        <p className="text-[13px] text-foreground leading-relaxed break-words">
                          {query.text}
                        </p>
                      </div>
                      <div className="flex items-center justify-end gap-1.5 mt-1 pr-1">
                        <span className="w-1 h-1 rounded-full bg-accent/30" />
                        <span className="text-[9px] text-muted-foreground/50">
                          {activeTree ? topicLabel : "All Topics"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cross-topic detection */}
                  {query.crossTopicDetection && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-accent/6 border border-accent/15"
                    >
                      <Plus size={12} className="text-accent shrink-0" />
                      <span className="text-xs text-accent font-medium truncate">
                        {query.crossTopicDetection.topicIcon}{" "}
                        {query.crossTopicDetection.topicLabel}
                      </span>
                      <span className="text-[10px] text-accent/50 shrink-0 ml-auto">
                        auto-added
                      </span>
                    </motion.div>
                  )}

                  {/* Best topic (global mode) */}
                  {query.bestTopic && isGlobalMode && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-accent/6 border border-accent/15"
                    >
                      <Zap size={12} className="text-accent shrink-0" />
                      <span className="text-xs text-accent font-medium truncate">
                        {query.bestTopic.topicIcon} {query.bestTopic.topicLabel}
                      </span>
                      <span className="text-[10px] text-accent/50 shrink-0 ml-auto">
                        best match
                      </span>
                    </motion.div>
                  )}

                  {/* Global match results */}
                  {query.globalMatches && query.globalMatches.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="rounded-xl border border-border/60 bg-surface/40 overflow-hidden"
                    >
                      <div className="px-3.5 py-2 border-b border-border/40 flex items-center gap-2">
                        <Sparkles size={10} className="text-accent" />
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          {query.globalMatches.length} match
                          {query.globalMatches.length > 1 ? "es" : ""} found
                        </span>
                      </div>
                      <div className="divide-y divide-border/30">
                        {query.globalMatches.slice(0, 5).map((match, i) => {
                          const style = CONFIDENCE_STYLES[match.confidence];
                          return (
                            <motion.button
                              key={`${match.topicId}-${match.subtopic.id}`}
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2 + i * 0.04 }}
                              onClick={() =>
                                onGlobalMatchSelect?.(
                                  match.topicId,
                                  match.subtopic.id
                                )
                              }
                              className="w-full text-left flex items-center gap-3 px-3.5 py-2.5 hover:bg-surface/80 transition-colors cursor-pointer group"
                            >
                              <span className="text-sm shrink-0">
                                {match.topicIcon}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">
                                  {match.subtopic.label}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {match.topicLabel}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span
                                  className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    style.dot
                                  )}
                                />
                                <span
                                  className={cn(
                                    "text-[9px] font-medium",
                                    style.text
                                  )}
                                >
                                  {match.confidence}
                                </span>
                              </div>
                              <ArrowRight
                                size={10}
                                className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                              />
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* Local match results */}
                  {!isGlobalMode && query.matches.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="rounded-xl border border-border/60 bg-surface/40 overflow-hidden"
                    >
                      <div className="px-3.5 py-2 border-b border-border/40 flex items-center gap-2">
                        <Sparkles size={10} className="text-accent" />
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          {query.matches.length} subtopic
                          {query.matches.length > 1 ? "s" : ""} matched
                        </span>
                      </div>
                      <div className="divide-y divide-border/30">
                        {query.matches.map((match, i) => {
                          const style = CONFIDENCE_STYLES[match.confidence];
                          const isSelected = selectedSubtopics.includes(
                            match.subtopic.id
                          );
                          return (
                            <motion.button
                              key={match.subtopic.id}
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2 + i * 0.04 }}
                              onClick={() => onSubtopicToggle(match.subtopic.id)}
                              className={cn(
                                "w-full text-left flex items-center gap-3 px-3.5 py-2.5 transition-colors cursor-pointer group",
                                isSelected
                                  ? "bg-accent/5"
                                  : "hover:bg-surface/80"
                              )}
                            >
                              <div
                                className={cn(
                                  "w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[9px] border transition-colors",
                                  isSelected
                                    ? "bg-accent border-accent text-white"
                                    : "bg-surface border-border text-muted-foreground"
                                )}
                              >
                                {isSelected ? "\u2713" : match.subtopic.id.slice(-2)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">
                                  {match.subtopic.label}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {match.matchedKeywords.slice(0, 3).join(", ")}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span
                                  className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    isSelected ? "bg-accent" : style.dot
                                  )}
                                />
                                <span
                                  className={cn(
                                    "text-[9px] font-medium",
                                    isSelected ? "text-accent" : style.text
                                  )}
                                >
                                  {isSelected ? "selected" : match.confidence}
                                </span>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* No matches fallback */}
                  {!isGlobalMode &&
                    query.matches.length === 0 &&
                    !query.crossTopicDetection && (
                      <div className="rounded-xl border border-border/40 bg-surface/30 px-4 py-3 space-y-2">
                        <p className="text-[11px] text-muted-foreground/60 text-center">
                          No direct matches found
                        </p>
                        {getSmartSuggestions(query.text, false, activeTree)
                          .length > 0 && (
                          <div className="flex flex-wrap gap-1.5 justify-center">
                            {getSmartSuggestions(query.text, false, activeTree).map(
                              (s) => (
                                <button
                                  key={s}
                                  onClick={() => onFreeTextChange(s)}
                                  className="px-2.5 py-1 rounded-full text-[11px] border border-border/60 hover:border-accent/30 hover:text-foreground hover:bg-accent/5 transition-all cursor-pointer text-muted-foreground"
                                >
                                  Try: {s}
                                </button>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )}

                  {isGlobalMode &&
                    (!query.globalMatches ||
                      query.globalMatches.length === 0) && (
                      <div className="rounded-xl border border-border/40 bg-surface/30 px-4 py-3 space-y-2">
                        <p className="text-[11px] text-muted-foreground/60 text-center">
                          No strong matches
                        </p>
                        {getSmartSuggestions(query.text, true, null).length >
                          0 && (
                          <div className="flex flex-wrap gap-1.5 justify-center">
                            {getSmartSuggestions(query.text, true, null).map(
                              (s) => (
                                <button
                                  key={s}
                                  onClick={() => onFreeTextChange(s)}
                                  className="px-2.5 py-1 rounded-full text-[11px] border border-border/60 hover:border-accent/30 hover:text-foreground hover:bg-accent/5 transition-all cursor-pointer text-muted-foreground"
                                >
                                  {s}
                                </button>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Composer ── */}
        <div className="border-t border-border/40 p-4">
          <motion.div
            animate={{
              borderColor: isFocused
                ? "rgba(139, 92, 246, 0.3)"
                : "rgba(255, 255, 255, 0.06)",
              boxShadow: isFocused
                ? "0 0 0 1px rgba(139, 92, 246, 0.08), 0 4px 16px -6px rgba(139, 92, 246, 0.1)"
                : "none",
            }}
            transition={{ duration: 0.25 }}
            className="relative bg-surface/60 border rounded-xl overflow-hidden"
          >
            {/* Top glow line */}
            <motion.div
              className="absolute top-0 left-[10%] right-[10%] h-px pointer-events-none"
              animate={{
                opacity: isFocused ? 1 : 0,
                scaleX: isFocused ? 1 : 0.3,
              }}
              transition={{ duration: 0.3 }}
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent)",
              }}
            />

            <div className="flex items-end gap-2 p-3">
              <div className="flex-1 min-w-0">
                <textarea
                  ref={textareaRef}
                  value={freeText}
                  onChange={(e) => onFreeTextChange(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholderText}
                  maxLength={120}
                  rows={1}
                  className="w-full bg-transparent text-sm text-foreground resize-none placeholder:text-muted-foreground/40 focus:outline-none leading-relaxed py-1.5 px-1 min-h-[36px] break-words"
                  style={{
                    height: "auto",
                    minHeight: "36px",
                    maxHeight: "100px",
                    overflow: "hidden",
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = `${Math.min(target.scrollHeight, 100)}px`;
                  }}
                />
              </div>

              <motion.button
                onClick={handleSend}
                disabled={!hasText || isSending}
                animate={{
                  scale: hasText ? 1 : 0.92,
                  opacity: hasText ? 1 : 0.35,
                  backgroundColor: hasText
                    ? "rgb(139, 92, 246)"
                    : "rgba(139, 92, 246, 0.1)",
                }}
                whileHover={hasText ? { scale: 1.06 } : {}}
                whileTap={hasText ? { scale: 0.94 } : {}}
                transition={{ type: "spring", stiffness: 500, damping: 28 }}
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Sparkles size={14} className="text-white" />
                  </motion.div>
                ) : (
                  <ArrowUp
                    size={15}
                    className={hasText ? "text-white" : "text-accent/30"}
                    strokeWidth={2.5}
                  />
                )}
              </motion.button>
            </div>

            {/* Bottom hint */}
            <motion.div
              animate={{
                opacity: isFocused ? 1 : 0,
                height: isFocused ? "auto" : 0,
              }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-2 flex items-center justify-between">
                <p className="text-[9px] text-muted-foreground/40">
                  Enter to send
                </p>
                {freeText.length >= 90 && (
                  <span
                    className={cn(
                      "text-[9px] tabular-nums",
                      freeText.length >= 110
                        ? "text-danger"
                        : "text-muted-foreground/40"
                    )}
                  >
                    {freeText.length}/120
                  </span>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
