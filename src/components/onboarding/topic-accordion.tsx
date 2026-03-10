"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TopicTree } from "@/lib/types";

interface TopicAccordionProps {
  tree: TopicTree;
  topicIcon: string;
  topicLabel: string;
  isOpen: boolean;
  onToggle: () => void;
  selectedSubtopics: string[];
  onSubtopicToggle: (subtopicId: string) => void;
}

export function TopicAccordion({
  tree,
  topicIcon,
  topicLabel,
  isOpen,
  onToggle,
  selectedSubtopics,
  onSubtopicToggle,
}: TopicAccordionProps) {
  const selectedCount = selectedSubtopics.length;

  return (
    <div
      className={cn(
        "rounded-2xl border transition-all duration-300",
        isOpen
          ? "bg-card border-accent/30 shadow-lg shadow-accent/5"
          : "bg-card/60 border-border hover:border-border-light hover:bg-card card-interactive"
      )}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 cursor-pointer group"
      >
        <span className="text-lg shrink-0">{topicIcon}</span>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-foreground">{topicLabel}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {selectedCount > 0
              ? `${selectedCount} subtopic${selectedCount > 1 ? "s" : ""} selected`
              : `${tree.subtopics.length} subtopics`}
          </p>
        </div>
        {selectedCount > 0 && !isOpen && (
          <span className="w-5 h-5 rounded-full bg-accent/15 text-accent text-[10px] font-bold flex items-center justify-center shrink-0">
            {selectedCount}
          </span>
        )}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="text-muted-foreground group-hover:text-muted shrink-0"
        >
          <ChevronDown size={16} />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 36 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-1.5">
              <div className="h-px bg-border mb-3" />
              {tree.subtopics.map((sub) => {
                const isSelected = selectedSubtopics.includes(sub.id);
                return (
                  <button
                    key={sub.id}
                    onClick={() => onSubtopicToggle(sub.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer group/sub",
                      isSelected
                        ? "bg-accent/10 border border-accent/25"
                        : "hover:bg-surface border border-transparent"
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all duration-200",
                        isSelected
                          ? "bg-accent text-white"
                          : "border border-border group-hover/sub:border-border-light"
                      )}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm transition-colors",
                        isSelected ? "text-foreground font-medium" : "text-muted group-hover/sub:text-foreground"
                      )}>
                        <span className="text-muted-foreground font-mono text-xs mr-1.5">{sub.id}</span>
                        {sub.label}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
