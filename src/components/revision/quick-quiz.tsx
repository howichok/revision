"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  Sparkles,
  MessageSquare,
  Zap,
} from "lucide-react";
import { useAppData } from "@/components/providers/app-data-provider";
import { Badge, Button, ProgressBar } from "@/components/ui";
import {
  evaluatePracticeShortAnswer,
  getPracticeSetId,
  getQuickQuizQuestionPool,
} from "@/lib/practice";
import { cn } from "@/lib/utils";
import { TOPICS } from "@/lib/types";

interface QuickQuizProps {
  topicId?: string;
  onClose?: () => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const difficultyColor = {
  easy: "text-success bg-success/10",
  medium: "text-warning bg-warning/10",
  hard: "text-danger bg-danger/10",
};

const typeIcon = {
  "multiple-choice": Zap,
  "short-answer": MessageSquare,
};

export function QuickQuiz({ topicId, onClose }: QuickQuizProps) {
  const { trackPracticeSetProgress } = useAppData();
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(topicId ?? null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isSavingProgress, setIsSavingProgress] = useState(false);

  const questions = useMemo(() => {
    const pool = getQuickQuizQuestionPool(selectedTopicId ?? undefined);
    return shuffleArray(pool).slice(0, Math.min(pool.length, 8));
  }, [selectedTopicId]);

  const availableTopics = useMemo(
    () =>
      TOPICS.filter((topic) => topic.id !== "esp").map((topic) => ({
        ...topic,
        count: getQuickQuizQuestionPool(topic.id).length,
      })),
    []
  );

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const progressPct =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const currentCheck =
    currentQuestion?.type === "short-answer"
      ? evaluatePracticeShortAnswer(typedAnswer, currentQuestion)
      : null;

  async function persistTopicQuizProgress(finalScore: number, finalTotal: number) {
    if (!selectedTopicId || finalTotal === 0) {
      return;
    }

    const topicInfo = TOPICS.find((topic) => topic.id === selectedTopicId);
    const progressPercent = Math.round((finalScore / finalTotal) * 100);

    setIsSavingProgress(true);
    setSaveError("");

    try {
      await trackPracticeSetProgress({
        practiceSetId: getPracticeSetId(selectedTopicId, "quiz"),
        topicId: selectedTopicId,
        title: `${topicInfo?.label ?? "Topic"} quick quiz`,
        progressPercent,
        minutesSpent: Math.max(8, finalTotal * 2),
      });
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Unable to save quiz progress."
      );
    } finally {
      setIsSavingProgress(false);
    }
  }

  function handleSelectAnswer(answer: string) {
    if (hasSubmitted) {
      return;
    }

    setSelectedAnswer(answer);
  }

  function handleSubmitAnswer() {
    if (!currentQuestion || hasSubmitted) {
      return;
    }

    const isCorrect =
      currentQuestion.type === "short-answer"
        ? evaluatePracticeShortAnswer(typedAnswer, currentQuestion).isCorrect
        : selectedAnswer === currentQuestion.correctAnswer;

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setHasSubmitted(true);
    setAnsweredCount((prev) => prev + 1);
  }

  function handleNext() {
    if (currentIndex + 1 >= totalQuestions) {
      setQuizFinished(true);
      void persistTopicQuizProgress(score, totalQuestions);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setSelectedAnswer(null);
    setTypedAnswer("");
    setHasSubmitted(false);
  }

  function handleRestart() {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setTypedAnswer("");
    setHasSubmitted(false);
    setScore(0);
    setAnsweredCount(0);
    setQuizFinished(false);
    setQuizStarted(false);
    setSaveError("");
    setSelectedTopicId(topicId ?? null);
  }

  function startQuiz(topic?: string) {
    if (topic) {
      setSelectedTopicId(topic);
    }

    setCurrentIndex(0);
    setSelectedAnswer(null);
    setTypedAnswer("");
    setHasSubmitted(false);
    setScore(0);
    setAnsweredCount(0);
    setQuizFinished(false);
    setQuizStarted(true);
    setSaveError("");
  }

  const isCorrect = hasSubmitted
    ? currentQuestion?.type === "short-answer"
      ? currentCheck?.isCorrect
      : selectedAnswer === currentQuestion?.correctAnswer
    : false;

  if (!quizStarted) {
    const lockedTopic = topicId ? TOPICS.find((topic) => topic.id === topicId) : null;
    const lockedTopicCount = topicId ? getQuickQuizQuestionPool(topicId).length : 0;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
            <Zap size={12} />
            Quick Quiz
          </div>
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            Test yourself with fast retrieval questions
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted">
            Questions are now built from glossary terms, mapped subtopics, and PDF-derived exam prompts instead of a fixed shell bank.
          </p>
        </div>

        {lockedTopic ? (
          <div className="rounded-[28px] border border-accent/20 bg-[linear-gradient(145deg,rgba(139,92,246,0.16),rgba(17,17,19,0.95)_42%,rgba(17,17,19,1))] p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl">
                    {lockedTopic.icon}
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Topic-focused quiz
                    </p>
                    <h3 className="text-xl font-semibold text-foreground">
                      {lockedTopic.label}
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {lockedTopicCount} retrieval questions built from this topic’s terms, subtopics, and exam question metadata.
                </p>
              </div>
              <Button size="lg" onClick={() => startQuiz(topicId)}>
                Start topic quiz
                <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-center">
              <button
                onClick={() => startQuiz()}
                className="cursor-pointer rounded-2xl border border-accent/30 bg-accent/10 px-6 py-4 text-left transition-all hover:border-accent/50 hover:bg-accent/15 hover:shadow-[0_0_24px_-8px_rgba(139,92,246,0.3)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15">
                    <Sparkles size={20} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">All Topics Mix</p>
                    <p className="text-xs text-muted-foreground">
                      {getQuickQuizQuestionPool().length} questions across all topics
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {availableTopics.map((topic) => {
                if (topic.count === 0) {
                  return null;
                }

                return (
                  <button
                    key={topic.id}
                    onClick={() => startQuiz(topic.id)}
                    className="group cursor-pointer rounded-2xl border border-border bg-surface/40 px-4 py-4 text-left transition-all hover:border-accent/20 hover:bg-card/80 hover:shadow-[0_4px_16px_-4px_rgba(139,92,246,0.1)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-card text-lg transition-colors group-hover:border-accent/20">
                          {topic.icon}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{topic.label}</p>
                          <p className="text-xs text-muted-foreground">{topic.count} questions</p>
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-muted-foreground transition-colors group-hover:text-accent" />
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  if (quizFinished) {
    const scorePct =
      totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const variant = scorePct >= 70 ? "success" : scorePct >= 40 ? "warning" : "danger";
    const topicInfo = selectedTopicId ? TOPICS.find((topic) => topic.id === selectedTopicId) : null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto max-w-lg space-y-6 py-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        >
          <Trophy
            size={56}
            className={cn(
              "mx-auto",
              scorePct >= 70
                ? "text-success"
                : scorePct >= 40
                  ? "text-warning"
                  : "text-danger"
            )}
          />
        </motion.div>

        <div>
          <h2 className="text-2xl font-bold text-foreground">Quiz complete</h2>
          <p className="mt-1 text-sm text-muted">
            {topicInfo ? `${topicInfo.icon} ${topicInfo.label}` : "All Topics Mix"}
          </p>
        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-surface/40 p-6">
          <div
            className="text-5xl font-bold tabular-nums"
            style={{ color: `var(--color-${variant})` }}
          >
            {score}/{totalQuestions}
          </div>
          <ProgressBar value={scorePct} className="mx-auto max-w-xs" />
          <p className="text-sm text-muted">
            {scorePct >= 80
              ? "Strong recall. Move into exam wording or another round."
              : scorePct >= 60
                ? "Solid start. Review the items you missed and run it again."
                : scorePct >= 40
                  ? "Some ideas are there, but the retrieval is still patchy."
                  : "This topic needs another repetition cycle before you move on."}
          </p>
        </div>

        {selectedTopicId && (
          <div className="rounded-xl border border-border bg-card/60 px-4 py-3 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Saved progress
            </p>
            <p className="mt-1 text-sm text-foreground">
              {isSavingProgress
                ? "Saving quiz result..."
                : saveError
                  ? saveError
                  : "This quiz score has been recorded in your practice progress."}
            </p>
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={handleRestart}>
            <RotateCcw size={14} />
            Try Again
          </Button>
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              Back to Workspace
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="rounded-2xl border border-border bg-surface/30 px-5 py-6 text-center">
        <p className="text-sm text-muted-foreground">
          No quiz questions are mapped for this topic yet.
        </p>
      </div>
    );
  }

  const TypeIcon = typeIcon[currentQuestion.type];
  const topicInfo = TOPICS.find((topic) => topic.id === currentQuestion.topicId);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <ProgressBar value={progressPct} size="sm" />
        </div>
        <div className="shrink-0 flex items-center gap-3">
          <span className="tabular-nums text-xs text-muted-foreground">
            {currentIndex + 1}/{totalQuestions}
          </span>
          <Badge variant="accent">{score} correct</Badge>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="space-y-5"
        >
          <div className="rounded-2xl border border-border bg-surface/30 p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-base">{topicInfo?.icon}</span>
                <span className="text-xs font-medium text-muted-foreground">
                  {topicInfo?.label}
                </span>
              </div>
              {currentQuestion.subtopicLabel && (
                <>
                  <span className="text-muted-foreground/30">/</span>
                  <span className="text-xs text-muted-foreground">
                    {currentQuestion.subtopicLabel}
                  </span>
                </>
              )}
              {currentQuestion.sourceLabel && (
                <Badge variant="default" className="ml-auto">
                  {currentQuestion.sourceLabel}
                </Badge>
              )}
              <span
                className={cn(
                  "rounded-lg px-2 py-0.5 text-[10px] font-medium",
                  difficultyColor[currentQuestion.difficulty]
                )}
              >
                {currentQuestion.difficulty}
              </span>
              <div className="flex items-center gap-1 rounded-lg bg-border/30 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                <TypeIcon size={10} />
                {currentQuestion.type === "multiple-choice" ? "MC" : "Written"}
              </div>
            </div>

            <h3 className="text-lg font-semibold leading-relaxed text-foreground">
              {currentQuestion.question}
            </h3>
          </div>

          <div className="space-y-2.5">
            {currentQuestion.type === "multiple-choice" &&
              currentQuestion.options?.map((option, index) => {
                const isSelected = selectedAnswer === option;
                const isCorrectOption = option === currentQuestion.correctAnswer;
                const letter = String.fromCharCode(65 + index);

                let borderClass = "border-border hover:border-accent/20";
                let bgClass = "bg-surface/40 hover:bg-card/80";

                if (hasSubmitted) {
                  if (isCorrectOption) {
                    borderClass = "border-success/40";
                    bgClass = "bg-success/10";
                  } else if (isSelected && !isCorrectOption) {
                    borderClass = "border-danger/40";
                    bgClass = "bg-danger/10";
                  } else {
                    borderClass = "border-border/50";
                    bgClass = "bg-surface/20 opacity-60";
                  }
                } else if (isSelected) {
                  borderClass = "border-accent/40";
                  bgClass = "bg-accent/10";
                }

                return (
                  <button
                    key={option}
                    onClick={() => handleSelectAnswer(option)}
                    disabled={hasSubmitted}
                    className={cn(
                      "w-full cursor-pointer rounded-xl border px-4 py-3.5 text-left transition-all disabled:cursor-default",
                      borderClass,
                      bgClass
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                          hasSubmitted && isCorrectOption
                            ? "bg-success/20 text-success"
                            : hasSubmitted && isSelected && !isCorrectOption
                              ? "bg-danger/20 text-danger"
                              : isSelected
                                ? "bg-accent/20 text-accent"
                                : "bg-border/50 text-muted-foreground"
                        )}
                      >
                        {hasSubmitted && isCorrectOption ? (
                          <CheckCircle2 size={14} />
                        ) : hasSubmitted && isSelected && !isCorrectOption ? (
                          <XCircle size={14} />
                        ) : (
                          letter
                        )}
                      </span>
                      <span
                        className={cn(
                          "text-sm",
                          hasSubmitted && !isCorrectOption && !isSelected
                            ? "text-muted-foreground"
                            : "text-foreground"
                        )}
                      >
                        {option}
                      </span>
                    </div>
                  </button>
                );
              })}

            {currentQuestion.type === "short-answer" && (
              <div className="space-y-3">
                <textarea
                  value={typedAnswer}
                  onChange={(event) => {
                    if (!hasSubmitted) {
                      setTypedAnswer(event.target.value);
                    }
                  }}
                  disabled={hasSubmitted}
                  rows={4}
                  placeholder="Type your answer here..."
                  className={cn(
                    "w-full rounded-2xl border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-1",
                    hasSubmitted
                      ? isCorrect
                        ? "border-success/40 bg-success/5 focus:ring-success/30"
                        : "border-danger/40 bg-danger/5 focus:ring-danger/30"
                      : "border-border bg-surface/40 focus:border-accent focus:ring-accent/30"
                  )}
                />
                {hasSubmitted && (
                  <div className="rounded-xl border border-border bg-card/60 px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Accepted answer cues
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[currentQuestion.correctAnswer, ...(currentQuestion.acceptableAnswers ?? [])]
                        .slice(0, 5)
                        .map((cue) => (
                          <span
                            key={`${currentQuestion.id}-${cue}`}
                            className="rounded-lg border border-border bg-surface/20 px-2.5 py-1 text-[11px] text-foreground/90"
                          >
                            {cue}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {hasSubmitted && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "rounded-2xl border px-4 py-4",
                isCorrect
                  ? "border-success/20 bg-success/5"
                  : "border-danger/20 bg-danger/5"
              )}
            >
              <div className="mb-2 flex items-center gap-2">
                {isCorrect ? (
                  <CheckCircle2 size={16} className="text-success" />
                ) : (
                  <XCircle size={16} className="text-danger" />
                )}
                <span
                  className={cn(
                    "text-sm font-semibold",
                    isCorrect ? "text-success" : "text-danger"
                  )}
                >
                  {isCorrect ? "Correct" : "Not quite"}
                </span>
                {currentQuestion.type === "short-answer" && currentCheck && (
                  <span className="text-xs text-muted-foreground">
                    Match confidence {Math.round(currentCheck.confidence * 100)}%
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed text-muted">
                {currentQuestion.explanation}
              </p>
            </motion.div>
          )}

          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" size="sm" onClick={onClose ?? handleRestart}>
              {onClose ? "Exit Quiz" : "Restart"}
            </Button>

            {!hasSubmitted ? (
              <Button
                onClick={handleSubmitAnswer}
                disabled={
                  currentQuestion.type === "short-answer"
                    ? !typedAnswer.trim()
                    : !selectedAnswer
                }
              >
                Check answer
              </Button>
            ) : (
              <Button onClick={handleNext}>
                {currentIndex + 1 >= totalQuestions ? "See results" : "Next question"}
                <ArrowRight size={14} />
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
