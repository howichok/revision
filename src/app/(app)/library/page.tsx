"use client";

import { useState } from "react";
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
  Badge,
  SearchComposer,
  ResourceCard,
} from "@/components/ui";
import { PageContainer } from "@/components/layout/page-container";
import { MOCK_RESOURCES, TOPICS } from "@/lib/types";

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

  const filtered = MOCK_RESOURCES.filter((r) => {
    const matchesSearch =
      search === "" ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase());
    const matchesType = activeType === "all" || r.type === activeType;
    const matchesTopic = activeTopic === "all" || r.topic === activeTopic;
    return matchesSearch && matchesType && matchesTopic;
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
            { label: "Past Papers", count: MOCK_RESOURCES.filter(r => r.type === "past-paper").length, icon: FileText, color: "text-accent" },
            { label: "Notes", count: MOCK_RESOURCES.filter(r => r.type === "notes").length, icon: BookOpen, color: "text-success" },
            { label: "Worksheets", count: MOCK_RESOURCES.filter(r => r.type === "worksheet").length, icon: PenLine, color: "text-warning" },
            { label: "Slides", count: MOCK_RESOURCES.filter(r => r.type === "slides").length, icon: Presentation, color: "text-accent" },
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
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-muted">
              {filtered.length} resource{filtered.length !== 1 ? "s" : ""}
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
                  const topicData = TOPICS.find((t) => t.id === resource.topic);
                  return (
                    <ResourceCard
                      key={resource.id}
                      title={resource.title}
                      description={resource.description}
                      type={resource.type}
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
