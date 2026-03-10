"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, ArrowLeft, CheckCircle, Layers } from "lucide-react";
import { useAppData } from "@/components/providers/app-data-provider";
import { Button } from "@/components/ui";
import { TopicAccordion } from "@/components/onboarding/topic-accordion";
import { SmartInputPanel } from "@/components/onboarding/smart-input-panel";
import { TOPICS, getTopicTree, getTopicById } from "@/lib/types";
import type { TopicTree } from "@/lib/types";

export default function FocusBreakdownPage() {
  const router = useRouter();
  const { onboarding, saveFocusBreakdown } = useAppData();

  const [weakAreas, setWeakAreas] = useState<string[]>([]);
  const [openTopicId, setOpenTopicId] = useState<string | null>(null);
  const [selectedSubtopics, setSelectedSubtopics] = useState<Record<string, string[]>>({});
  const [freeTextNotes, setFreeTextNotes] = useState<Record<string, string>>({});
  const [globalFreeText, setGlobalFreeText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!onboarding) {
      return;
    }
    setWeakAreas(onboarding.weakAreas);
    setSelectedSubtopics(onboarding.focusBreakdown?.selectedSubtopics ?? {});
    setFreeTextNotes(onboarding.focusBreakdown?.freeTextNotes ?? {});
    setGlobalFreeText(onboarding.focusBreakdown?.globalNote ?? "");
    // Auto-open the first topic
    if (onboarding.weakAreas.length > 0) {
      setOpenTopicId(onboarding.weakAreas[0]);
    }
  }, [onboarding]);

  const handleAccordionToggle = useCallback((topicId: string) => {
    setOpenTopicId((prev) => (prev === topicId ? null : topicId));
  }, []);

  const handleSubtopicToggle = useCallback((topicId: string, subtopicId: string) => {
    setSelectedSubtopics((prev) => {
      const current = prev[topicId] || [];
      const updated = current.includes(subtopicId)
        ? current.filter((s) => s !== subtopicId)
        : [...current, subtopicId];
      return { ...prev, [topicId]: updated };
    });
  }, []);

  const handleFreeTextChange = useCallback((topicId: string, text: string) => {
    setFreeTextNotes((prev) => ({ ...prev, [topicId]: text }));
  }, []);

  // Auto-topic detection: add a new topic to weak areas and open it
  const handleAutoTopicAdd = useCallback((topicId: string) => {
    setWeakAreas((prev) => {
      if (prev.includes(topicId)) return prev;
      return [...prev, topicId];
    });
    setOpenTopicId(topicId);
  }, []);

  // Global match select: add topic, open it, select subtopic
  const handleGlobalMatchSelect = useCallback((topicId: string, subtopicId: string) => {
    setWeakAreas((prev) => {
      if (prev.includes(topicId)) return prev;
      return [...prev, topicId];
    });
    setOpenTopicId(topicId);
    setSelectedSubtopics((prev) => {
      const current = prev[topicId] || [];
      if (current.includes(subtopicId)) return prev;
      return { ...prev, [topicId]: [...current, subtopicId] };
    });
  }, []);

  async function handleContinue() {
    setError("");
    setIsSaving(true);

    try {
      await saveFocusBreakdown({
        weakAreas,
        selectedSubtopics,
        freeTextNotes,
        globalNote: globalFreeText,
      });
      router.push("/home");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save your focus breakdown."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleBack() {
    router.push("/onboarding");
  }

  const totalSelected = Object.values(selectedSubtopics).flat().length;
  const activeTree: TopicTree | undefined = openTopicId ? getTopicTree(openTopicId) : undefined;
  const activeTopic = openTopicId ? getTopicById(openTopicId) : null;

  if (weakAreas.length === 0) return null;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute top-[-15%] left-[60%] w-[500px] h-[500px] bg-accent/2 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-accent/2 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Progress indicator */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2 mb-8 justify-center"
        >
          <div className="flex items-center gap-1.5">
            <CheckCircle size={16} className="text-accent" />
            <span className="text-xs text-accent font-medium">Profile</span>
          </div>
          <div className="w-8 h-px bg-accent/30" />
          <div className="flex items-center gap-1.5">
            <CheckCircle size={16} className="text-accent" />
            <span className="text-xs text-accent font-medium">Weak Areas</span>
          </div>
          <div className="w-8 h-px bg-accent/30" />
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-accent flex items-center justify-center">
              <span className="text-[10px] text-white font-bold">3</span>
            </div>
            <span className="text-xs text-foreground font-medium">Focus Breakdown</span>
          </div>
          <div className="w-8 h-px bg-border" />
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-border flex items-center justify-center">
              <span className="text-[10px] text-muted-foreground font-bold">4</span>
            </div>
            <span className="text-xs text-muted-foreground font-medium">Dashboard</span>
          </div>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Let&apos;s dig a bit deeper
          </h1>
          <p className="text-muted text-sm max-w-lg mx-auto">
            Pick the specific bits that feel shaky, or type what&apos;s confusing you and we&apos;ll
            try to match it. This helps us focus your revision even more.
          </p>
        </motion.div>

        {/* Two-column layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 360, damping: 32, delay: 0.15 }}
          className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8"
        >
          {/* Left column — Accordions */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <Layers size={15} className="text-muted-foreground" />
              <p className="text-xs font-medium text-muted uppercase tracking-wider">Your weak topics</p>
            </div>
            {weakAreas.map((topicId) => {
              const tree = getTopicTree(topicId);
              const topic = TOPICS.find((t) => t.id === topicId);
              if (!tree || !topic) return null;
              return (
                <TopicAccordion
                  key={topicId}
                  tree={tree}
                  topicIcon={topic.icon}
                  topicLabel={topic.label}
                  isOpen={openTopicId === topicId}
                  onToggle={() => handleAccordionToggle(topicId)}
                  selectedSubtopics={selectedSubtopics[topicId] || []}
                  onSubtopicToggle={(subId) => handleSubtopicToggle(topicId, subId)}
                />
              );
            })}
          </div>

          {/* Right column — Smart input (larger, no clip) */}
          <div className="lg:col-span-3 overflow-visible">
            <div className="lg:sticky lg:top-24 min-h-[560px] max-h-[calc(100vh-6rem)] flex flex-col pl-2 pr-4 pb-4 overflow-visible">
              <SmartInputPanel
                activeTree={activeTree || null}
                topicLabel={activeTopic?.label ?? ""}
                topicIcon={activeTopic?.icon ?? ""}
                selectedSubtopics={openTopicId ? (selectedSubtopics[openTopicId] || []) : []}
                onSubtopicToggle={(subId) => {
                  if (openTopicId) handleSubtopicToggle(openTopicId, subId);
                }}
                freeText={openTopicId ? (freeTextNotes[openTopicId] || "") : globalFreeText}
                onFreeTextChange={(text) => {
                  if (openTopicId) handleFreeTextChange(openTopicId, text);
                  else setGlobalFreeText(text);
                }}
                weakAreas={weakAreas}
                onAutoTopicAdd={handleAutoTopicAdd}
                onGlobalMatchSelect={handleGlobalMatchSelect}
              />
            </div>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border"
        >
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft size={14} />
            Back to topics
          </Button>

          <div className="flex items-center gap-4">
            <p className="text-xs text-muted-foreground">
              {totalSelected > 0
                ? `${totalSelected} subtopic${totalSelected > 1 ? "s" : ""} selected`
                : "You can skip this or pick subtopics"}
            </p>
            <Button
              size="lg"
              onClick={handleContinue}
              className="group"
              disabled={isSaving}
              isLoading={isSaving}
            >
              Continue to Dashboard
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
        </motion.div>
        {error && (
          <div className="mt-4 flex items-center gap-2 text-sm text-danger bg-danger/10 rounded-lg px-3 py-2.5">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
