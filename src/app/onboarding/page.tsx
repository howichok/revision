"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Button, Chip } from "@/components/ui";
import { TOPICS } from "@/lib/types";
import { storage } from "@/lib/storage";

export default function OnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function handleContinue() {
    if (selected.length === 0) return;

    // Save weak areas (completedAt will be set after focus breakdown)
    storage.setOnboarding({
      weakAreas: selected,
      completedAt: "",
    });

    router.push("/onboarding/focus");
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-6">
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-accent/2 rounded-full blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
        className="w-full max-w-xl relative z-10"
      >
        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-10 justify-center flex-wrap">
          <div className="flex items-center gap-1.5">
            <CheckCircle size={16} className="text-accent" />
            <span className="text-xs text-accent font-medium">Profile</span>
          </div>
          <div className="w-6 h-px bg-accent/30" />
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-accent flex items-center justify-center">
              <span className="text-[10px] text-white font-bold">2</span>
            </div>
            <span className="text-xs text-foreground font-medium">Weak Areas</span>
          </div>
          <div className="w-6 h-px bg-border" />
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-border flex items-center justify-center">
              <span className="text-[10px] text-muted-foreground font-bold">3</span>
            </div>
            <span className="text-xs text-muted-foreground font-medium">Focus</span>
          </div>
          <div className="w-6 h-px bg-border" />
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-border flex items-center justify-center">
              <span className="text-[10px] text-muted-foreground font-bold">4</span>
            </div>
            <span className="text-xs text-muted-foreground font-medium">Dashboard</span>
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-3">
            Which topics are you struggling with?
          </h1>
          <p className="text-muted text-sm max-w-md mx-auto">
            Pick the ones you find hardest. We&apos;ll use this to shape
            your revision — you can always change it later.
          </p>
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {TOPICS.map((topic) => (
            <motion.div
              key={topic.id}
              whileTap={{ scale: 0.97 }}
            >
              <Chip
                label={topic.label}
                icon={topic.icon}
                selected={selected.includes(topic.id)}
                onClick={() => toggle(topic.id)}
              />
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3">
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={selected.length === 0}
            className="group"
          >
            Continue
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
          </Button>
          <p className="text-xs text-muted-foreground">
            {selected.length === 0
              ? "Select at least one topic"
              : `${selected.length} topic${selected.length > 1 ? "s" : ""} selected`}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
