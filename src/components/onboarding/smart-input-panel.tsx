"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Sparkles, ArrowRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { TOPIC_TREES, TOPICS } from "@/lib/types";
import type { TopicTree, Subtopic } from "@/lib/types";

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

/** Normalise term for partial/fuzzy match: allow 2+ char terms, strip punctuation */
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
        if (kwLower.includes(term) || (term.length >= 2 && kwLower.startsWith(term)) || (term.length >= 2 && kwLower.includes(term))) {
          if (!matched.includes(kw)) matched.push(kw);
        }
      }
      if (sub.label.toLowerCase().includes(term) || (term.length >= 2 && sub.label.toLowerCase().startsWith(term))) {
        if (!matched.includes(sub.label)) matched.push(sub.label);
      }
    }
    if (matched.length > 0) {
      const confidence = matched.length >= 3 ? "high" : matched.length >= 2 ? "medium" : "low";
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
            (kw.toLowerCase().includes(term) || term.includes(kw.toLowerCase().slice(0, 4))) &&
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
  bestTopic: { topicId: string; topicLabel: string; topicIcon: string; matchCount: number } | null;
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
          if (kwLower.includes(term) || term.includes(kwLower.slice(0, Math.max(3, kwLower.length - 1)))) {
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
        const confidence = matched.length >= 3 ? "high" : matched.length >= 2 ? "medium" : "low";
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

  let bestTopic: { topicId: string; topicLabel: string; topicIcon: string; matchCount: number } | null = null;
  let bestCount = 0;
  for (const [topicId, info] of Object.entries(topicCounts)) {
    if (info.count > bestCount) {
      bestCount = info.count;
      bestTopic = { topicId, topicLabel: info.label, topicIcon: info.icon, matchCount: info.count };
    }
  }

  return {
    matches: matches.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      if (order[a.confidence] !== order[b.confidence]) return order[a.confidence] - order[b.confidence];
      return b.matchedKeywords.length - a.matchedKeywords.length;
    }),
    bestTopic,
  };
}

/** When there are no matches, suggest topics or keywords that partially match the query. */
function getSmartSuggestions(query: string, isGlobalMode: boolean, activeTree: TopicTree | null): string[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const out: string[] = [];
  if (isGlobalMode) {
    for (const t of TOPICS) {
      if (t.id === "esp") continue;
      const label = t.label.toLowerCase();
      if (label.includes(q) || q.includes(label.slice(0, 4)) || label.split(/\s+/).some((w) => w.startsWith(q) || q.startsWith(w.slice(0, 2)))) {
        out.push(t.label);
      }
    }
    if (out.length === 0) {
      const first = q.slice(0, 2);
      for (const t of TOPICS) {
        if (t.id === "esp") continue;
        if (t.label.toLowerCase().includes(first) || t.label.toLowerCase().startsWith(first)) out.push(t.label);
      }
    }
    if (out.length > 4) return out.slice(0, 4);
    if (out.length > 0) return out;
    return TOPICS.filter((t) => t.id !== "esp").slice(0, 4).map((t) => t.label);
  }

  if (activeTree) {
    const seen = new Set<string>();
    for (const sub of activeTree.subtopics) {
      for (const kw of sub.keywords) {
        const kwLower = kw.toLowerCase();
        if (kwLower.includes(q) || q.includes(kwLower.slice(0, 3)) || kwLower.startsWith(q)) {
          if (!seen.has(kw)) { seen.add(kw); out.push(kw); }
        }
      }
      if (sub.label.toLowerCase().includes(q) && !seen.has(sub.label)) {
        seen.add(sub.label);
        out.push(sub.label);
      }
    }
    if (out.length > 5) return out.slice(0, 5);
    if (out.length > 0) return out;
    activeTree.subtopics.slice(0, 3).flatMap((s) => s.keywords.slice(0, 2)).forEach((kw) => { if (!out.includes(kw)) out.push(kw); });
  }
  return out.slice(0, 5);
}

const SAMPLE_QUERIES = [
  "SQL and databases",
  "encryption, firewalls",
  "decomposition, flowcharts",
  "loops and variables",
  "GDPR, data protection",
  "phishing, social engineering",
];

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
  const [impulse, setImpulse] = useState(false);
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

    setImpulse(true);
    setTimeout(() => setImpulse(false), 150);

    setTimeout(() => {
      let matches: SuggestionMatch[] = [];
      let globalMatchesResult: GlobalMatch[] | undefined;
      let bestTopicResult: { topicId: string; topicLabel: string; topicIcon: string; matchCount: number } | null = null;
      let crossTopicDetection: CrossTopicDetection | undefined;

      if (activeTree) {
        matches = findMatches(activeTree, queryText);

        if (onAutoTopicAdd) {
          const detected = findCrossTopicMatch(activeTree.topicId, weakAreas, queryText);
          if (detected) {
            crossTopicDetection = detected;
            onAutoTopicAdd(detected.topicId);
          }
        }
      } else {
        const result = findGlobalMatches(queryText);
        globalMatchesResult = result.matches;
        bestTopicResult = result.bestTopic;

        if (bestTopicResult && bestTopicResult.matchCount >= 2 && onAutoTopicAdd && !weakAreas.includes(bestTopicResult.topicId)) {
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
        setTimeout(() => {
          setIsSending(false);
        }, 300);
      }, 120);
    }, 600);
  }, [freeText, activeTree, topicLabel, isSending, onFreeTextChange, weakAreas, onAutoTopicAdd]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const confidenceColors = {
    high: { bg: "bg-success/10", text: "text-success", label: "Strong match" },
    medium: { bg: "bg-warning/10", text: "text-warning", label: "Possible match" },
    low: { bg: "bg-card", text: "text-muted", label: "Weak match" },
  };

  const hasText = freeText.trim().length > 0;

  const placeholderText = isGlobalMode
    ? "Describe what you\u2019re struggling with\u2026"
    : `What feels confusing about ${topicLabel.toLowerCase()}?`;

  const levitate = {
    y: [0, -4, 0],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" as const },
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTree?.topicId ?? "global"}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ type: "spring", stiffness: 400, damping: 32, mass: 0.8 }}
        className="flex flex-col h-full max-h-full min-h-0 overflow-visible"
      >
        {/* ── Minimal header ── */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            {activeTree ? (
              <>
                <span className="text-base">{topicIcon}</span>
                <h3 className="text-xs font-semibold text-foreground">{topicLabel}</h3>
              </>
            ) : (
              <>
                <Sparkles size={14} className="text-accent" />
                <h3 className="text-xs font-semibold text-foreground">Smart Search</h3>
              </>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {activeTree
              ? `Describe what feels confusing about ${topicLabel.toLowerCase()}`
              : "Type what you\u2019re struggling with \u2014 we\u2019ll match it to topics"}
          </p>
        </div>

        {/* ── Floating results area (padding so glow/shadow not clipped) ── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 mb-3 py-2 px-0.5">
          {/* Suggestion chips when empty */}
          {sentQueries.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="space-y-3"
            >
              <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-widest">
                {activeTree ? "Try these" : "Quick start"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {activeTree
                  ? activeTree.subtopics.slice(0, 4).flatMap((s) => s.keywords.slice(0, 2)).map((kw) => (
                      <button
                        key={kw}
                        onClick={() => onFreeTextChange(freeText ? `${freeText}, ${kw}` : kw)}
                        className="px-2.5 py-1 rounded-full text-[11px] text-muted-foreground border border-border/60 hover:border-accent/30 hover:text-foreground hover:bg-accent/5 transition-all cursor-pointer"
                      >
                        {kw}
                      </button>
                    ))
                  : SAMPLE_QUERIES.map((sq) => (
                      <button
                        key={sq}
                        onClick={() => onFreeTextChange(sq)}
                        className="px-2.5 py-1 rounded-full text-[11px] text-muted-foreground border border-border/60 hover:border-accent/30 hover:text-foreground hover:bg-accent/5 transition-all cursor-pointer"
                      >
                        {sq}
                      </button>
                    ))}
              </div>
              {isGlobalMode && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {TOPICS.slice(0, 8).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onFreeTextChange(t.label)}
                      className="px-2 py-1 rounded-full text-[11px] text-muted-foreground border border-border/60 hover:border-accent/30 hover:text-foreground hover:bg-accent/5 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span className="text-[10px]">{t.icon}</span> {t.label}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Floating sent prompts + results ── */}
          <div className="space-y-4">
            <AnimatePresence>
              {sentQueries.map((query) => (
                <motion.div
                  key={query.id}
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="space-y-2.5"
                >
                  {/* User message — right-aligned, subtle levitate */}
                  <div className="flex justify-end">
                    <motion.div
                      animate={levitate}
                      className="relative max-w-[85%] min-w-0"
                    >
                      <div className="absolute -inset-2 rounded-2xl bg-accent/6 blur-xl pointer-events-none" aria-hidden />
                      <div className="relative bg-[#121215] border border-accent/15 rounded-2xl px-4 py-3 shadow-[0_4px_20px_-6px_rgba(139,92,246,0.15)]">
                        <p className="text-xs text-foreground/90 leading-relaxed text-left break-words">
                          {query.text}
                        </p>
                        <div className="flex items-center justify-end gap-1.5 mt-2">
                          <span className="w-1 h-1 rounded-full bg-accent/40 shrink-0" />
                          <span className="text-[9px] text-muted-foreground/50 truncate max-w-full">
                            {activeTree ? topicLabel : "All Topics"}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Cross-topic detection */}
                  {query.crossTopicDetection && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 32, delay: 0.1 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent/6 border border-accent/15 min-w-0"
                    >
                      <Plus size={11} className="text-accent shrink-0" />
                      <span className="text-[11px] text-accent font-medium truncate min-w-0">
                        {query.crossTopicDetection.topicIcon} {query.crossTopicDetection.topicLabel}
                      </span>
                      <span className="text-[9px] text-muted-foreground shrink-0">auto-added</span>
                    </motion.div>
                  )}

                  {/* Best topic (global mode) */}
                  {query.bestTopic && isGlobalMode && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 32, delay: 0.1 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent/6 border border-accent/15 min-w-0"
                    >
                      <Sparkles size={11} className="text-accent shrink-0" />
                      <span className="text-[11px] text-accent font-medium truncate min-w-0">
                        {query.bestTopic.topicIcon} {query.bestTopic.topicLabel}
                      </span>
                      <span className="text-[9px] text-muted-foreground shrink-0">best match</span>
                    </motion.div>
                  )}

                  {/* Match results — compact floating chips */}
                  {query.globalMatches && query.globalMatches.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.25, duration: 0.3 }}
                      className="space-y-1.5 px-1"
                    >
                      {query.globalMatches.slice(0, 4).map((match, i) => (
                        <motion.button
                          key={`${match.topicId}-${match.subtopic.id}`}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 32, delay: 0.15 + i * 0.04 }}
                          onClick={() => onGlobalMatchSelect?.(match.topicId, match.subtopic.id)}
                          className="w-full text-left flex items-center gap-2.5 p-2 rounded-lg hover:bg-surface/80 transition-colors cursor-pointer group"
                        >
                          <span className="text-[10px] shrink-0">{match.topicIcon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium text-foreground truncate">{match.subtopic.label}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{match.topicLabel}</p>
                          </div>
                          <span className={cn("px-1.5 py-px rounded text-[9px] font-medium shrink-0", confidenceColors[match.confidence].bg, confidenceColors[match.confidence].text)}>
                            {confidenceColors[match.confidence].label}
                          </span>
                          <ArrowRight size={9} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </motion.button>
                      ))}
                    </motion.div>
                  )}

                  {!isGlobalMode && query.matches.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.25, duration: 0.3 }}
                      className="space-y-1.5 px-1"
                    >
                      {query.matches.map((match, i) => {
                        const colors = confidenceColors[match.confidence];
                        const isSelected = selectedSubtopics.includes(match.subtopic.id);
                        return (
                          <motion.button
                            key={match.subtopic.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 32, delay: 0.15 + i * 0.04 }}
                            onClick={() => onSubtopicToggle(match.subtopic.id)}
                            className={cn(
                              "w-full text-left flex items-center gap-2.5 p-2 rounded-lg transition-colors cursor-pointer group",
                              isSelected ? "bg-accent/8" : "hover:bg-surface/80"
                            )}
                          >
                            <div className={cn("w-5 h-5 rounded flex items-center justify-center shrink-0 text-[9px]", isSelected ? "bg-accent/20 text-accent" : "bg-surface text-muted-foreground")}>
                              {isSelected ? "\u2713" : match.subtopic.id.slice(-2)}
                            </div>
                            <p className="text-[11px] font-medium text-foreground truncate flex-1">{match.subtopic.label}</p>
                            <span className={cn("px-1.5 py-px rounded text-[9px] font-medium shrink-0", isSelected ? "bg-accent/15 text-accent" : `${colors.bg} ${colors.text}`)}>
                              {isSelected ? "Selected" : colors.label}
                            </span>
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  )}

                  {/* No matches — show smart suggestions */}
                  {!isGlobalMode && query.matches.length === 0 && !query.crossTopicDetection && (
                    <div className="space-y-2 px-1">
                      <p className="text-[11px] text-muted-foreground/60 text-center">No direct matches</p>
                      {getSmartSuggestions(query.text, false, activeTree).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          {getSmartSuggestions(query.text, false, activeTree).map((s) => (
                            <button
                              key={s}
                              onClick={() => onFreeTextChange(s)}
                              className="px-2.5 py-1 rounded-full text-[11px] border border-border/60 hover:border-accent/30 hover:text-foreground hover:bg-accent/5 transition-all cursor-pointer text-muted-foreground"
                            >
                              Try: {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {isGlobalMode && (!query.globalMatches || query.globalMatches.length === 0) && (
                    <div className="space-y-2 px-1">
                      <p className="text-[11px] text-muted-foreground/60 text-center">No strong matches</p>
                      {getSmartSuggestions(query.text, true, null).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          {getSmartSuggestions(query.text, true, null).map((s) => (
                            <button
                              key={s}
                              onClick={() => onFreeTextChange(s)}
                              className="px-2.5 py-1 rounded-full text-[11px] border border-border/60 hover:border-accent/30 hover:text-foreground hover:bg-accent/5 transition-all cursor-pointer text-muted-foreground"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
              </motion.div>
            ))}
          </AnimatePresence>
          </div>
        </div>

        {/* ── Standalone Composer (larger, breathing room for glow; no clip) ── */}
        <div className="relative mt-auto pt-4 pb-6 px-3 overflow-visible shrink-0">
          <motion.div
            className="relative"
            style={{ transformOrigin: "bottom center" }}
            animate={{
              scaleY: impulse ? 1.02 : 1,
              y: impulse ? -3 : [0, -2, 0],
              boxShadow: impulse
                ? "0 0 24px -4px rgba(139, 92, 246, 0.25)"
                : "0 0 0 0px transparent",
            }}
            transition={{
              scaleY: { type: "spring", stiffness: 600, damping: 35 },
              y: impulse
                ? { type: "spring", stiffness: 600, damping: 35 }
                : { duration: 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
              boxShadow: { duration: 0.15 },
            }}
          >
            <motion.div
              animate={{
                borderColor: isFocused
                  ? "rgba(139, 92, 246, 0.35)"
                  : "rgba(255, 255, 255, 0.06)",
                boxShadow: isFocused
                  ? "0 0 0 1px rgba(139, 92, 246, 0.1), 0 8px 24px -8px rgba(139, 92, 246, 0.12)"
                  : "0 0 0 0px transparent",
              }}
              transition={{ borderColor: { duration: 0.25 }, boxShadow: { duration: 0.25 } }}
              className="relative bg-[#0c0c0f] border rounded-2xl overflow-hidden"
            >
            {/* Top glow line */}
            <motion.div
              className="absolute top-0 left-[15%] right-[15%] h-px pointer-events-none"
              animate={{ opacity: isFocused ? 1 : 0, scaleX: isFocused ? 1 : 0.2 }}
              transition={{ duration: 0.35 }}
              style={{ background: "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.25), transparent)" }}
            />

            <div className="relative flex items-end gap-3 p-4">
              <div className="flex-1 min-w-0">
                <textarea
                  ref={textareaRef}
                  value={freeText}
                  onChange={(e) => onFreeTextChange(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholderText}
                  maxLength={50}
                  rows={1}
                  className="w-full bg-transparent text-sm text-foreground resize-none placeholder:text-muted-foreground/50 focus:outline-none leading-relaxed py-2 px-2 min-h-[44px] break-words"
                  style={{ height: "auto", minHeight: "44px", maxHeight: "120px", overflow: "hidden" }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                  }}
                />
              </div>
              <motion.button
                onClick={handleSend}
                disabled={!hasText || isSending}
                animate={{
                  scale: hasText ? 1 : 0.9,
                  opacity: hasText ? 1 : 0.3,
                  backgroundColor: hasText ? "rgb(139, 92, 246)" : "rgba(139, 92, 246, 0.12)",
                }}
                whileHover={hasText ? { scale: 1.04 } : {}}
                whileTap={hasText ? { scale: 0.96 } : {}}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 cursor-pointer disabled:cursor-not-allowed mb-0.5"
              >
                {isSending ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}>
                    <Sparkles size={14} className="text-white" />
                  </motion.div>
                ) : (
                  <ArrowUp size={15} className={hasText ? "text-white" : "text-accent/30"} strokeWidth={2.5} />
                )}
              </motion.button>
            </div>

            {/* Hint row */}
            <motion.div
              animate={{ opacity: isFocused ? 1 : 0, height: isFocused ? "auto" : 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-2 flex items-center justify-between">
                <p className="text-[9px] text-muted-foreground/40">Enter to send</p>
                {freeText.length >= 40 && (
                  <span className={cn("text-[9px] tabular-nums", freeText.length >= 48 ? "text-danger" : "text-muted-foreground/40")}>
                    {freeText.length}/50
                  </span>
                )}
              </div>
            </motion.div>
          </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
