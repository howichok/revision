"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  BookOpen,
  Video,
  PenLine,
  Filter,
  SlidersHorizontal,
  Presentation,
  Search,
} from "lucide-react";
import {
  SearchComposer,
  ResourceCard,
} from "@/components/ui";
import { PageContainer } from "@/components/layout/page-container";
import {
  getLibraryResources,
  searchLibraryResources,
  searchStructuredContent,
} from "@/lib/content";
import { searchTopicMetadata } from "@/lib/topic-search";
import { TOPICS } from "@/lib/types";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const typeFilters = [
  { id: "all", label: "All", icon: SlidersHorizontal },
  { id: "past-paper", label: "Past Papers", icon: FileText },
  { id: "notes", label: "Notes", icon: BookOpen },
  { id: "worksheet", label: "Worksheets", icon: PenLine },
  { id: "slides", label: "Slides", icon: Presentation },
  { id: "video", label: "Videos", icon: Video },
];

export default function LibraryPage() {
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [activeTopic, setActiveTopic] = useState("all");
  const allResources = useMemo(() => getLibraryResources(), []);
  const topicSearch = useMemo(
    () =>
      searchTopicMetadata(search, {
        activeTopicId: activeTopic !== "all" ? activeTopic : undefined,
      }),
    [search, activeTopic]
  );
  const searchMatches = useMemo(
    () =>
      searchStructuredContent(search, {
        legacyTopicId: activeTopic !== "all" ? activeTopic : undefined,
      }),
    [search, activeTopic]
  );
  const matchedTopicIds = useMemo(() => {
    return Array.from(
      new Set([
        ...topicSearch.directMatches.map((match) => match.topicId),
        ...topicSearch.relatedMatches.map((match) => match.topicId),
        ...topicSearch.suggestedTopics.map((topic) => topic.topicId),
      ])
    );
  }, [topicSearch.directMatches, topicSearch.relatedMatches, topicSearch.suggestedTopics]);

  const rankedResources = useMemo(
    () =>
      searchLibraryResources(search, {
        legacyTopicId: activeTopic !== "all" ? activeTopic : undefined,
        matchedTopicIds,
      }),
    [activeTopic, matchedTopicIds, search]
  );

  const filtered = (search ? rankedResources : allResources).filter((r) => {
    const matchesType = activeType === "all" || r.displayType === activeType;
    const matchesTopic = activeTopic === "all" || r.legacyTopicIds.includes(activeTopic as typeof TOPICS[number]["id"]);
    return matchesType && matchesTopic;
  });

  return (
    <PageContainer>
      <motion.div initial="hidden" animate="visible" className="space-y-6">
        {/* Header */}
        <motion.div variants={fadeUp} custom={0}>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Library</h1>
          <p className="text-muted text-sm">
            Past papers, notes, worksheets — everything organised by topic.
          </p>
        </motion.div>

        {/* Search composer — matches the smart input style */}
        <motion.div variants={fadeUp} custom={1}>
          <SearchComposer
            value={search}
            onChange={setSearch}
            placeholder="Search for resources, topics, or keywords..."
          />
        </motion.div>

        {/* Filters */}
        <motion.div variants={fadeUp} custom={2} className="space-y-4">
          {/* Type filters */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {typeFilters.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveType(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  activeType === id
                    ? "bg-accent/10 text-accent border border-accent/30"
                    : "bg-card border border-border text-muted hover:text-foreground hover:border-border-light"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Topic filters */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTopic("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                activeTopic === "all"
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:text-muted"
              }`}
            >
              All Topics
            </button>
            {TOPICS.map((topic) => (
              <button
                key={topic.id}
                onClick={() => setActiveTopic(topic.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  activeTopic === topic.id
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:text-muted"
                }`}
              >
                {topic.icon} {topic.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Category summary cards */}
        <motion.div variants={fadeUp} custom={3} className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Past Papers", count: allResources.filter(r => r.displayType === "past-paper").length, icon: FileText, color: "text-accent" },
            { label: "Notes", count: allResources.filter(r => r.displayType === "notes").length, icon: BookOpen, color: "text-success" },
            { label: "Worksheets", count: allResources.filter(r => r.displayType === "worksheet").length, icon: PenLine, color: "text-warning" },
            { label: "Slides", count: allResources.filter(r => r.displayType === "slides").length, icon: Presentation, color: "text-accent" },
            { label: "Topics", count: TOPICS.length, icon: SlidersHorizontal, color: "text-muted-foreground" },
          ].map((cat) => (
            <div key={cat.label} className="bg-card border border-border rounded-xl p-4 hover:border-border-light transition-colors card-interactive">
              <cat.icon size={18} className={`${cat.color} mb-2`} />
              <p className="text-lg font-semibold">{cat.count}</p>
              <p className="text-xs text-muted">{cat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Resource grid */}
        <motion.div variants={fadeUp} custom={4} className="space-y-4">
          {search && (
            <div className="grid gap-4 xl:grid-cols-4">
              <div className="rounded-2xl border border-border bg-card/70 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Topic Matches
                  </p>
                  {topicSearch.noDirectMatch ? (
                    <span className="text-[10px] text-warning">closest results</span>
                  ) : (
                    <span className="text-[10px] text-success">ranked</span>
                  )}
                </div>
                <div className="space-y-2">
                  {topicSearch.directMatches.length > 0 ? (
                    topicSearch.directMatches.slice(0, 3).map((match) => (
                      <div key={match.id} className="rounded-xl border border-border bg-surface/40 px-3 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {match.topicIcon} {match.subtopicTitle}
                          </p>
                          <span className="text-[11px] text-accent">{match.score}</span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {match.topicTitle} / {match.section}
                        </p>
                        <p className="mt-2 text-xs text-muted line-clamp-2">{match.shortDescription}</p>
                      </div>
                    ))
                  ) : topicSearch.relatedMatches.length > 0 ? (
                    topicSearch.relatedMatches.slice(0, 3).map((match) => (
                      <div key={match.id} className="rounded-xl border border-border bg-surface/40 px-3 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {match.topicIcon} {match.subtopicTitle}
                          </p>
                          <span className="text-[11px] text-muted-foreground">{match.score}</span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {match.topicTitle} / {match.section}
                        </p>
                        <p className="mt-2 text-xs text-muted line-clamp-2">{match.reasons[0] ?? match.shortDescription}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No topic matches yet for this search.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">
                  Curriculum Matches
                </p>
                <div className="space-y-2">
                  {searchMatches.curriculumPoints.length > 0 ? (
                    searchMatches.curriculumPoints.slice(0, 3).map((point) => (
                      <div key={point.id} className="rounded-xl border border-border bg-surface/40 px-3 py-3">
                        <p className="text-xs text-accent font-medium">{point.code}</p>
                        <p className="text-sm font-medium text-foreground mt-1">{point.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{point.summary}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No numbered curriculum points matched this search yet.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">
                  Question Matches
                </p>
                <div className="space-y-2">
                  {searchMatches.questions.length > 0 ? (
                    searchMatches.questions.slice(0, 3).map((question) => (
                      <div key={question.id} className="rounded-xl border border-border bg-surface/40 px-3 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">{question.title}</p>
                          {question.marks && (
                            <span className="text-[11px] text-accent">{question.marks} marks</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{question.sourceLabel}</p>
                        <p className="text-xs text-muted mt-2 line-clamp-2">{question.expectation}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No linked question metadata matched this search.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">
                  Key Terms
                </p>
                <div className="flex flex-wrap gap-2">
                  {searchMatches.glossaryTerms.length > 0 ? (
                    searchMatches.glossaryTerms.slice(0, 8).map((term) => (
                      <span
                        key={term.id}
                        className="rounded-lg border border-border bg-surface/40 px-2.5 py-1.5 text-xs text-foreground"
                      >
                        {term.term}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No glossary terms matched this search.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-muted">
              {filtered.length} resource{filtered.length !== 1 ? "s" : ""}
              {search ? " ranked by relevance" : ""}
            </h2>
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-muted transition-colors cursor-pointer">
              <Filter size={12} />
              Sort by recent
            </button>
          </div>

          <AnimatePresence mode="wait">
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-16"
              >
                <Search size={32} className="text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted text-sm">Nothing matches your filters.</p>
                <p className="text-muted-foreground text-xs mt-1">Try a different topic or resource type.</p>
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {filtered.map((resource, i) => {
                  const topicData = resource.legacyTopicIds
                    .map((topicId) => TOPICS.find((topic) => topic.id === topicId))
                    .find(Boolean);
                  return (
                    <ResourceCard
                      key={resource.id}
                      title={resource.title}
                      description={resource.summary}
                      type={resource.displayType}
                      topic={topicData?.label}
                      topicIcon={topicData?.icon}
                      year={resource.year}
                      index={i}
                    />
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
