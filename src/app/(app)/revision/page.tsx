"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import {
  ClipboardCheck,
  Target,
  TrendingUp,
  ArrowRight,
  RotateCcw,
  ChevronRight,
  Star,
  BookOpen,
  Clock,
  Play,
  CheckCircle,
} from "lucide-react";
import {
  Button,
  Card,
  Badge,
  ProgressBar,
  ProgressRing,
  MaterialCard,
} from "@/components/ui";
import { PageContainer } from "@/components/layout/page-container";
import Link from "next/link";
import { storage } from "@/lib/storage";
import {
  MOCK_DIAGNOSTIC,
  TOPICS,
  MOCK_MATERIALS,
  MOCK_RECENT_ACTIVITY,
} from "@/lib/types";
import type { DiagnosticResult } from "@/lib/types";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      type: "spring",
      stiffness: 360,
      damping: 32,
      mass: 0.9,
    },
  }),
};

function getScoreVariant(pct: number): "success" | "warning" | "danger" {
  if (pct >= 75) return "success";
  if (pct >= 50) return "warning";
  return "danger";
}

const DIAGNOSTIC_TOPICS = TOPICS.filter((t) => t.id !== "esp");

interface DiagnosticQuestion {
  id: number;
  topicIcon: string;
  topicLabel: string;
  question: string;
  options: string[];
}

const DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  { id: 0, topicIcon: "🧩", topicLabel: "Problem Solving", question: "What does decomposition mean in computational thinking?", options: ["Breaking a problem into smaller parts", "Removing unnecessary code", "Testing the final program", "Writing pseudocode"] },
  { id: 1, topicIcon: "💻", topicLabel: "Intro to Programming", question: "Which of these is a valid Python data type?", options: ["integer", "paragraph", "cell", "row"] },
  { id: 2, topicIcon: "🔒", topicLabel: "Security", question: "What is the primary purpose of encryption?", options: ["Make data unreadable without a key", "Delete old files securely", "Speed up network traffic", "Compress large databases"] },
  { id: 3, topicIcon: "⚖️", topicLabel: "Legislation", question: "Which UK law covers personal data protection?", options: ["Data Protection Act 2018", "Freedom of Information Act", "Computer Misuse Act", "Copyright Act 1988"] },
  { id: 4, topicIcon: "🗄️", topicLabel: "Data", question: "What does SQL stand for?", options: ["Structured Query Language", "Simple Question Logic", "System Quality Layer", "Standard Queue List"] },
  { id: 5, topicIcon: "🖥️", topicLabel: "Digital Environments", question: "What is cloud computing?", options: ["Delivering services over the internet", "Storing files on a USB drive", "Using a local area network only", "Running programs without hardware"] },
];

type DiagnosticPhase = "intro" | "questions" | "analysing";

export default function RevisionPage() {
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [phase, setPhase] = useState<DiagnosticPhase>("intro");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [diagnosticStep, setDiagnosticStep] = useState(-1);
  const [justCompleted, setJustCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setDiagnostic(storage.getDiagnostic());
  }, []);

  function handleStartDiagnostic() {
    setPhase("questions");
    setQuestionIndex(0);
    setSelectedAnswer(null);
  }

  function handleAnswerSelect(optionIndex: number) {
    setSelectedAnswer(optionIndex);
    setTimeout(() => {
      if (questionIndex < DIAGNOSTIC_QUESTIONS.length - 1) {
        setQuestionIndex((prev) => prev + 1);
        setSelectedAnswer(null);
      } else {
        startAnalysisAnimation();
      }
    }, 600);
  }

  function startAnalysisAnimation() {
    setPhase("analysing");
    setDiagnosticStep(0);

    let step = 0;
    intervalRef.current = setInterval(() => {
      step += 1;
      if (step < DIAGNOSTIC_TOPICS.length) {
        setDiagnosticStep(step);
      } else if (step === DIAGNOSTIC_TOPICS.length) {
        setDiagnosticStep(DIAGNOSTIC_TOPICS.length);
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        storage.setDiagnostic(MOCK_DIAGNOSTIC);
        setDiagnostic(MOCK_DIAGNOSTIC);
        setPhase("intro");
        setDiagnosticStep(-1);
        setJustCompleted(true);
        setTimeout(() => setJustCompleted(false), 5000);
      }
    }, 500);
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function handleResetDiagnostic() {
    localStorage.removeItem("kosti_diagnostic");
    setDiagnostic(null);
    setPhase("intro");
    setJustCompleted(false);
  }

  if (!diagnostic) {
    const isCalculating = diagnosticStep === DIAGNOSTIC_TOPICS.length;
    const analysisPct = phase === "analysing"
      ? isCalculating ? 100 : Math.round(((diagnosticStep + 1) / DIAGNOSTIC_TOPICS.length) * 90)
      : 0;
    const currentQuestion = DIAGNOSTIC_QUESTIONS[questionIndex];
    const questionProgressPct = Math.round(((questionIndex + 1) / DIAGNOSTIC_QUESTIONS.length) * 100);

    return (
      <PageContainer size="md">
        <AnimatePresence mode="wait">
          {/* ─── Phase: Intro ─── */}
          {phase === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <div className="text-center max-w-lg">
                <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-8">
                  <ClipboardCheck size={36} className="text-accent" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-3">Diagnostic Test</h1>
                <p className="text-muted text-sm leading-relaxed mb-2">
                  Before we can build your revision plan, we need to see where
                  you&apos;re at across all the Year 1 topics.
                </p>
                <p className="text-muted-foreground text-sm mb-10">
                  Covers all 8 core topics. Your results shape your entire revision experience.
                </p>
                <Button size="lg" onClick={handleStartDiagnostic} className="group">
                  Start Diagnostic
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
                </Button>
                <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><ClipboardCheck size={12} />~30 questions</span>
                  <span className="flex items-center gap-1.5"><Target size={12} />8 topic areas</span>
                </div>
                <div className="mt-10 flex flex-wrap gap-2 justify-center">
                  {DIAGNOSTIC_TOPICS.map((topic) => (
                    <span key={topic.id} className="px-3 py-1.5 bg-card border border-border rounded-lg text-xs text-muted">
                      {topic.icon} {topic.label}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── Phase: Questions ─── */}
          {phase === "questions" && currentQuestion && (
            <motion.div
              key="questions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <div className="w-full max-w-lg">
                {/* Progress header */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">
                    Question {questionIndex + 1} of {DIAGNOSTIC_QUESTIONS.length}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">{questionProgressPct}%</span>
                </div>
                <div className="w-full bg-border/40 rounded-full h-1 overflow-hidden mb-8">
                  <motion.div
                    className="h-full bg-accent rounded-full"
                    animate={{ width: `${questionProgressPct}%` }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  />
                </div>

                {/* Question card */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={questionIndex}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg">{currentQuestion.topicIcon}</span>
                      <span className="text-[11px] text-muted-foreground font-medium tracking-wide uppercase">
                        {currentQuestion.topicLabel}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-foreground mb-6 leading-snug">
                      {currentQuestion.question}
                    </h2>

                    <div className="space-y-2.5">
                      {currentQuestion.options.map((option, i) => {
                        const isSelected = selectedAnswer === i;
                        const isCorrect = i === 0;
                        const showResult = selectedAnswer !== null;
                        return (
                          <motion.button
                            key={i}
                            onClick={() => selectedAnswer === null && handleAnswerSelect(i)}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06, duration: 0.25 }}
                            className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 ${
                              showResult && isSelected && isCorrect
                                ? "bg-success/10 border-success/30 text-foreground"
                                : showResult && isSelected && !isCorrect
                                  ? "bg-danger/10 border-danger/30 text-foreground"
                                  : showResult && isCorrect
                                    ? "bg-success/5 border-success/20 text-foreground"
                                    : "bg-card border-border hover:border-accent/30 hover:bg-card/80 text-foreground cursor-pointer"
                            }`}
                            disabled={selectedAnswer !== null}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                                showResult && isSelected && isCorrect
                                  ? "bg-success/20 text-success"
                                  : showResult && isSelected && !isCorrect
                                    ? "bg-danger/20 text-danger"
                                    : showResult && isCorrect
                                      ? "bg-success/15 text-success"
                                      : "bg-surface text-muted-foreground"
                              }`}>
                                {String.fromCharCode(65 + i)}
                              </span>
                              <span className="text-sm">{option}</span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* ─── Phase: Analysing (the existing completion animation) ─── */}
          {phase === "analysing" && (
            <motion.div
              key="analysing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <div className="text-center max-w-md w-full">
                <div className="mb-8">
                  <ProgressRing
                    value={analysisPct}
                    size={100}
                    strokeWidth={6}
                    label={isCalculating ? "Done" : `${diagnosticStep + 1}/${DIAGNOSTIC_TOPICS.length}`}
                  />
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={diagnosticStep}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="mb-6"
                  >
                    {isCalculating ? (
                      <>
                        <p className="text-sm font-semibold text-foreground">Calculating results...</p>
                        <p className="text-xs text-muted-foreground mt-1">Building your revision plan</p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <span className="text-lg">{DIAGNOSTIC_TOPICS[diagnosticStep]?.icon}</span>
                          <p className="text-sm font-semibold text-foreground">
                            Analysing {DIAGNOSTIC_TOPICS[diagnosticStep]?.label}...
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Topic {diagnosticStep + 1} of {DIAGNOSTIC_TOPICS.length}
                        </p>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>

                <div className="w-full bg-border/40 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className="h-full bg-accent rounded-full"
                    animate={{ width: `${analysisPct}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>

                <div className="mt-8 flex flex-wrap gap-2 justify-center">
                  {DIAGNOSTIC_TOPICS.map((topic, i) => (
                    <motion.span
                      key={topic.id}
                      animate={{
                        opacity: i <= diagnosticStep ? 1 : 0.35,
                        scale: i === diagnosticStep ? 1.1 : 1,
                      }}
                      transition={{ duration: 0.25 }}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                        i < diagnosticStep
                          ? "bg-accent/10 border-accent/30 text-accent"
                          : i === diagnosticStep
                            ? "bg-accent/15 border-accent/40 text-accent font-medium"
                            : "bg-card border-border text-muted"
                      }`}
                    >
                      {topic.icon} {topic.label}
                    </motion.span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </PageContainer>
    );
  }

  const sortedTopics = [...diagnostic.topicScores].sort(
    (a, b) => a.score / a.maxScore - b.score / b.maxScore
  );
  const weakestTopics = sortedTopics.slice(0, 3);
  const strongestTopics = sortedTopics.slice(-2).reverse();

  const recommendedMaterials = MOCK_MATERIALS.filter((m) => {
    const weakNames = weakestTopics.map((t) => t.topic.toLowerCase());
    return weakNames.some(
      (name) =>
        m.topic.toLowerCase().includes(name.split(" ")[0]) ||
        name.includes(m.topic.toLowerCase().split(" ")[0])
    );
  }).slice(0, 3);

  const displayMaterials = recommendedMaterials.length > 0 ? recommendedMaterials : MOCK_MATERIALS.slice(0, 3);

  return (
    <PageContainer>
      <motion.div initial="hidden" animate="visible" className="space-y-6">

        {/* ─── Diagnostic Complete Banner ─── */}
        <AnimatePresence>
          {justCompleted && (
            <motion.div
              initial={{ opacity: 0, y: -12, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 36 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-3 p-3.5 bg-success/8 border border-success/20 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-success/15 flex items-center justify-center shrink-0">
                  <CheckCircle size={16} className="text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Diagnostic Complete</p>
                  <p className="text-xs text-muted-foreground">Your personalised revision plan is ready. Focus on red areas first for the biggest gains.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Header ─── */}
        <motion.div variants={fadeUp} custom={0} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold">Your Revision Plan</h1>
          <Button variant="ghost" size="sm" onClick={handleResetDiagnostic}>
            <RotateCcw size={14} /> Reset
          </Button>
        </motion.div>

        {/* ─── Main block: topic list (left, shifted right) + Prioritise these (right) ─── */}
        <motion.div variants={fadeUp} custom={1} className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 lg:gap-8">
          {/* All topics — vertical list, clear click affordance */}
          <div className="lg:pl-8 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-accent shrink-0" />
                <h2 className="font-semibold text-base">All Topic Scores</h2>
              </div>
              <p className="text-xs text-muted-foreground">Tap or click to open</p>
            </div>
            <div className="space-y-2">
              {sortedTopics.map((topic, i) => {
                const pct = Math.round((topic.score / topic.maxScore) * 100);
                const topicData = TOPICS.find((t) => t.id === topic.category);
                const isWeak = pct < 50;
                const isStrong = pct >= 75;
                return (
                  <Link key={topic.topic} href={`/revision/${topic.category}`} className="block cursor-pointer">
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: "spring", stiffness: 380, damping: 32, delay: 0.02 + i * 0.03 }}
                      whileHover={{ x: 4, transition: { duration: 0.2 } }}
                      whileTap={{ scale: 0.99 }}
                      className={`group flex items-center gap-4 rounded-xl border px-4 py-3.5 transition-all duration-200 ${
                        isWeak
                          ? "bg-danger/5 border-danger/20 hover:bg-danger/10 hover:border-danger/30 hover:shadow-[0_0_0_1px_rgba(239,68,68,0.15)]"
                          : isStrong
                            ? "bg-success/5 border-success/20 hover:bg-success/10 hover:border-success/30 hover:shadow-[0_0_0_1px_rgba(34,197,94,0.15)]"
                            : "bg-card/60 border-border hover:bg-accent/5 hover:border-accent/25 hover:shadow-[0_0_0_1px_rgba(139,92,246,0.12)]"
                      }`}
                    >
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg transition-colors ${
                        isWeak ? "bg-danger/10" : isStrong ? "bg-success/10" : "bg-surface"
                      }`}>
                        {topicData?.icon ?? "\u2014"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate group-hover:text-foreground">{topic.topic}</p>
                        <ProgressBar value={pct} size="sm" className="mt-2 max-w-[140px]" />
                      </div>
                      <span className={`text-sm font-bold tabular-nums shrink-0 ${isWeak ? "text-danger" : isStrong ? "text-success" : "text-warning"}`}>
                        {pct}%
                      </span>
                      <span className="flex items-center gap-1.5 shrink-0 text-xs font-medium text-accent opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                        Open
                        <ChevronRight size={16} className="inline" />
                      </span>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right column: Prioritise these + Looking strong */}
          <div className="lg:order-none flex flex-col gap-4">
            <Card className="border-danger/20 bg-danger/5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-danger shrink-0" />
                <h3 className="font-semibold text-sm">Prioritise these</h3>
              </div>
              <div className="space-y-2">
                {weakestTopics.map((topic, i) => {
                  const pct = Math.round((topic.score / topic.maxScore) * 100);
                  return (
                    <Link key={topic.topic} href={`/revision/${topic.category}`}>
                      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-card border border-border hover:bg-danger/5 hover:border-danger/20 transition-colors cursor-pointer">
                        <span className="w-6 h-6 rounded-md bg-danger/15 text-danger text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        <span className="text-sm font-medium truncate flex-1 min-w-0">{topic.topic}</span>
                        <span className="text-xs font-bold text-danger tabular-nums shrink-0">{pct}%</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </Card>
            <Card className="border-success/20 bg-success/5 sticky top-24">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-success shrink-0" />
                <h3 className="font-semibold text-sm">Looking strong</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {strongestTopics.map((topic) => {
                  const pct = Math.round((topic.score / topic.maxScore) * 100);
                  return (
                    <Link key={topic.topic} href={`/revision/${topic.category}`}>
                      <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border hover:bg-success/5 hover:border-success/20 transition-colors text-sm font-medium">
                        <span className="w-5 h-5 rounded-md bg-success/15 text-success text-[10px] font-bold flex items-center justify-center">{"\u2713"}</span>
                        <span className="text-foreground">{topic.topic}</span>
                        <span className="text-success text-xs font-bold tabular-nums">{pct}%</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </Card>
          </div>
        </motion.div>

        {/* ─── Recommended materials ─── */}
        <motion.div variants={fadeUp} custom={2}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star size={16} className="text-accent" />
              <h3 className="font-semibold text-sm">Recommended Next</h3>
            </div>
            <span className="text-xs text-muted-foreground">Based on your weakest areas</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayMaterials.map((material, i) => (
              <MaterialCard key={material.id} data={material} index={i} />
            ))}
          </div>
        </motion.div>

        {/* ─── Recent activity + performance ─── */}
        <motion.div variants={fadeUp} custom={3} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} className="text-muted-foreground" />
              <h3 className="font-semibold text-sm">Recent Activity</h3>
            </div>
            <div className="space-y-1">
              {MOCK_RECENT_ACTIVITY.slice(0, 4).map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-surface flex items-center justify-center shrink-0">
                    <BookOpen size={12} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Play size={14} className="text-accent" />
                <h3 className="font-semibold text-sm">Recent Performance</h3>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: "Last session score", value: "72%", variant: "warning" as const },
                  { label: "Questions answered", value: "18", variant: "default" as const },
                  { label: "Time spent", value: "24 min", variant: "default" as const },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                    <Badge variant={stat.variant}>{stat.value}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

      </motion.div>
    </PageContainer>
  );
}
