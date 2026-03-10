"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Target, Brain, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const features = [
  {
    icon: Target,
    title: "Find Your Gaps",
    description: "A quick diagnostic test shows you exactly which topics need the most work — no more guessing.",
  },
  {
    icon: Brain,
    title: "Focused Revision",
    description: "Get a personalised plan that targets your weakest areas first, so every session counts.",
  },
  {
    icon: TrendingUp,
    title: "Track Your Progress",
    description: "See how you're improving across all 8 topics and the ESP, with clear score breakdowns.",
  },
];

export default function WelcomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[50%] -translate-x-1/2 w-[800px] h-[600px] bg-accent/4 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[400px] h-[400px] bg-accent/2 rounded-full blur-[80px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <span className="text-accent font-bold text-sm">K</span>
          </div>
          <span className="font-semibold text-foreground text-sm tracking-tight">Kosti</span>
        </div>
        <Link href="/auth">
          <Button variant="ghost" size="sm">
            Sign in
          </Button>
        </Link>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-24 pb-32 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20">
            <Sparkles size={14} className="text-accent" />
            <span className="text-xs font-medium text-accent">T-Level Digital — Year 1 Revision</span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]"
          >
            Revise smarter,
            <br />
            <span className="gradient-text">not harder.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-lg sm:text-xl text-muted max-w-xl mx-auto leading-relaxed"
          >
            Kosti figures out your weak topics and builds a revision plan
            around them — so you actually focus on what you need.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="flex items-center justify-center gap-4 pt-4">
            <Link href="/auth">
              <Button size="lg" className="group">
                Start Revising
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-32">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              variants={fadeUp}
              custom={i}
              className="bg-card/50 border border-border rounded-2xl p-6 hover:bg-card-hover hover:border-border-light transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <feature.icon size={20} className="text-accent" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Bottom CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 pb-24 text-center">
        <div className="bg-card border border-border rounded-3xl p-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent" />
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-3">Ready to go?</h2>
            <p className="text-muted text-sm mb-6 max-w-md mx-auto">
              Takes less than a minute to set up. A diagnostic test will show you exactly where to start.
            </p>
            <Link href="/auth">
              <Button size="lg">
                Get Started
                <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between text-xs text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} Kosti</span>
          <span>Built for T-Level DSD students.</span>
        </div>
      </footer>
    </div>
  );
}
