"use client";

import { useState, useCallback, useMemo } from "react";
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
import { Badge, Button, ProgressBar } from "@/components/ui";
import { cn } from "@/lib/utils";
import { TOPICS, TOPIC_TREES } from "@/lib/types";
import type { TopicId } from "@/lib/types";

/* ─── Quiz question types ─── */

interface QuizQuestion {
  id: string;
  topicId: string;
  type: "multiple-choice" | "short-answer" | "true-false";
  question: string;
  options?: string[];
  correctAnswer: string;
  acceptableAnswers?: string[];
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  subtopicLabel?: string;
}

/* ─── Hardcoded quiz bank (shell data) ─── */

const QUIZ_BANK: QuizQuestion[] = [
  // Problem Solving
  {
    id: "q-ps-1",
    topicId: "problem-solving",
    type: "multiple-choice",
    question: "Which of these is NOT a part of computational thinking?",
    options: ["Decomposition", "Abstraction", "Compilation", "Pattern Recognition"],
    correctAnswer: "Compilation",
    explanation: "Computational thinking includes decomposition, abstraction, pattern recognition, and algorithmic thinking. Compilation is a programming process, not a thinking technique.",
    difficulty: "easy",
    subtopicLabel: "1.1 Computational thinking",
  },
  {
    id: "q-ps-2",
    topicId: "problem-solving",
    type: "short-answer",
    question: "What is the purpose of a trace table when working with algorithms?",
    correctAnswer: "track variable values",
    acceptableAnswers: ["track variables", "trace variables", "show variable values", "follow values through an algorithm", "step through algorithm", "debug"],
    explanation: "A trace table is used to track the values of variables as you step through an algorithm line by line. It helps you verify the logic and find errors.",
    difficulty: "medium",
    subtopicLabel: "1.1 Computational thinking",
  },
  {
    id: "q-ps-3",
    topicId: "problem-solving",
    type: "true-false",
    question: "Binary search requires the data to be sorted before it can be used.",
    correctAnswer: "True",
    explanation: "Binary search works by repeatedly halving the search space. This only works if the data is already sorted in order.",
    difficulty: "easy",
    subtopicLabel: "1.2 Algorithms",
  },
  {
    id: "q-ps-4",
    topicId: "problem-solving",
    type: "multiple-choice",
    question: "Which sorting algorithm repeatedly compares adjacent elements and swaps them?",
    options: ["Merge sort", "Bubble sort", "Binary sort", "Quick sort"],
    correctAnswer: "Bubble sort",
    explanation: "Bubble sort compares adjacent elements and swaps them if they are in the wrong order, repeating this process until the list is sorted.",
    difficulty: "easy",
    subtopicLabel: "1.2 Algorithms",
  },

  // Intro to Programming
  {
    id: "q-prog-1",
    topicId: "intro-programming",
    type: "multiple-choice",
    question: "What data type would you use to store whether a user is logged in?",
    options: ["String", "Integer", "Boolean", "Float"],
    correctAnswer: "Boolean",
    explanation: "A Boolean stores True or False values, which is perfect for representing an on/off or yes/no state like login status.",
    difficulty: "easy",
    subtopicLabel: "2.1 Program data",
  },
  {
    id: "q-prog-2",
    topicId: "intro-programming",
    type: "short-answer",
    question: "Name one type of validation check you could apply to a user's age input.",
    correctAnswer: "range check",
    acceptableAnswers: ["range check", "type check", "presence check", "length check", "range", "type", "presence", "format check"],
    explanation: "A range check would ensure the age falls within a reasonable range (e.g., 0-120). Type check ensures it's a number. Presence check ensures something was entered.",
    difficulty: "medium",
    subtopicLabel: "2.6 Validation and error handling",
  },
  {
    id: "q-prog-3",
    topicId: "intro-programming",
    type: "true-false",
    question: "A 'for' loop is used when you know in advance how many times you want to repeat.",
    correctAnswer: "True",
    explanation: "A 'for' loop iterates a set number of times. A 'while' loop is used when the number of iterations depends on a condition.",
    difficulty: "easy",
    subtopicLabel: "2.4 Program structure",
  },
  {
    id: "q-prog-4",
    topicId: "intro-programming",
    type: "multiple-choice",
    question: "What does the modulus operator (%) return?",
    options: ["The quotient of division", "The remainder of division", "The product", "The power"],
    correctAnswer: "The remainder of division",
    explanation: "The modulus operator returns the remainder when one number is divided by another. For example, 7 % 3 = 1.",
    difficulty: "easy",
    subtopicLabel: "2.2 Operators",
  },

  // Emerging Issues
  {
    id: "q-ei-1",
    topicId: "emerging-issues",
    type: "multiple-choice",
    question: "Which term describes the gap between people who have access to technology and those who don't?",
    options: ["Tech gap", "Digital divide", "Access barrier", "Connectivity split"],
    correctAnswer: "Digital divide",
    explanation: "The digital divide refers to the inequality between groups in terms of access to, use of, or knowledge of information and communication technologies.",
    difficulty: "easy",
    subtopicLabel: "3.1 Moral and ethical issues",
  },
  {
    id: "q-ei-2",
    topicId: "emerging-issues",
    type: "short-answer",
    question: "Give one example of an emerging technology that could transform healthcare.",
    correctAnswer: "AI",
    acceptableAnswers: ["AI", "artificial intelligence", "IoT", "machine learning", "VR", "AR", "blockchain", "big data", "wearables", "robotics"],
    explanation: "Technologies like AI (for diagnosis), IoT (for patient monitoring), and VR (for surgical training) are transforming healthcare.",
    difficulty: "medium",
    subtopicLabel: "3.2 Emerging trends and technologies",
  },

  // Legislation
  {
    id: "q-leg-1",
    topicId: "legislation",
    type: "multiple-choice",
    question: "Which law makes it illegal to access a computer system without permission?",
    options: ["GDPR", "Computer Misuse Act", "Data Protection Act", "Freedom of Information Act"],
    correctAnswer: "Computer Misuse Act",
    explanation: "The Computer Misuse Act 1990 makes it an offence to gain unauthorised access to computer systems, modify data without permission, or use computers for criminal purposes.",
    difficulty: "easy",
    subtopicLabel: "4.1 Legislation",
  },
  {
    id: "q-leg-2",
    topicId: "legislation",
    type: "true-false",
    question: "Under GDPR, organisations must obtain explicit consent before collecting personal data.",
    correctAnswer: "True",
    explanation: "GDPR requires organisations to have a lawful basis for processing personal data, with explicit consent being one of the key bases. Users must be clearly informed about what data is collected and why.",
    difficulty: "medium",
    subtopicLabel: "4.1 Legislation",
  },

  // Business
  {
    id: "q-biz-1",
    topicId: "business",
    type: "multiple-choice",
    question: "Which implementation strategy runs the old and new systems at the same time?",
    options: ["Direct changeover", "Phased implementation", "Parallel running", "Pilot testing"],
    correctAnswer: "Parallel running",
    explanation: "Parallel running means both old and new systems operate simultaneously. This is the safest approach but also the most expensive as it requires double the resources.",
    difficulty: "medium",
    subtopicLabel: "5.3 Technical change management",
  },
  {
    id: "q-biz-2",
    topicId: "business",
    type: "short-answer",
    question: "What is a stakeholder in a business context?",
    correctAnswer: "anyone with an interest in the business",
    acceptableAnswers: ["person with interest", "anyone affected", "interested party", "someone who is affected by the business", "person who has a stake", "individual or group with interest"],
    explanation: "A stakeholder is any individual or group that has an interest in or is affected by the activities and decisions of a business, such as employees, customers, shareholders, and suppliers.",
    difficulty: "easy",
    subtopicLabel: "5.1 The business environment",
  },

  // Data
  {
    id: "q-data-1",
    topicId: "data",
    type: "multiple-choice",
    question: "Which SQL command is used to retrieve data from a database?",
    options: ["INSERT", "UPDATE", "SELECT", "DELETE"],
    correctAnswer: "SELECT",
    explanation: "SELECT is used to query and retrieve data from a database. INSERT adds new records, UPDATE modifies existing records, and DELETE removes records.",
    difficulty: "easy",
    subtopicLabel: "6.3 Data systems",
  },
  {
    id: "q-data-2",
    topicId: "data",
    type: "true-false",
    question: "A primary key uniquely identifies each record in a database table.",
    correctAnswer: "True",
    explanation: "A primary key is a field (or combination of fields) that uniquely identifies each record in a table. No two records can have the same primary key value, and it cannot be null.",
    difficulty: "easy",
    subtopicLabel: "6.3 Data systems",
  },
  {
    id: "q-data-3",
    topicId: "data",
    type: "short-answer",
    question: "What is the difference between data and information?",
    correctAnswer: "data is raw, information is processed",
    acceptableAnswers: ["data is raw facts", "information has meaning", "data is unprocessed", "information is data with context", "data has no meaning", "information is processed data"],
    explanation: "Data consists of raw, unprocessed facts and figures. Information is data that has been processed, organised, and given context so it has meaning.",
    difficulty: "medium",
    subtopicLabel: "6.1 Data and information in organisations",
  },

  // Digital Environments
  {
    id: "q-de-1",
    topicId: "digital-environments",
    type: "multiple-choice",
    question: "Which protocol translates domain names into IP addresses?",
    options: ["HTTP", "FTP", "DNS", "SMTP"],
    correctAnswer: "DNS",
    explanation: "DNS (Domain Name System) resolves human-readable domain names (like google.com) into IP addresses that computers use to identify each other on the network.",
    difficulty: "medium",
    subtopicLabel: "7.2 Networks",
  },
  {
    id: "q-de-2",
    topicId: "digital-environments",
    type: "true-false",
    question: "SaaS means the user manages the operating system and middleware themselves.",
    correctAnswer: "False",
    explanation: "With SaaS (Software as a Service), the provider manages everything including the OS, middleware, and application. The user just uses the software through a browser. IaaS is where users manage more of the stack.",
    difficulty: "medium",
    subtopicLabel: "7.4 Cloud environments",
  },

  // Security
  {
    id: "q-sec-1",
    topicId: "security",
    type: "multiple-choice",
    question: "Which type of attack tricks users into revealing sensitive information through fake emails?",
    options: ["Brute force", "DDoS", "Phishing", "SQL injection"],
    correctAnswer: "Phishing",
    explanation: "Phishing uses deceptive emails, messages, or websites that impersonate legitimate organisations to trick users into revealing passwords, financial details, or other sensitive information.",
    difficulty: "easy",
    subtopicLabel: "8.1 Security risks",
  },
  {
    id: "q-sec-2",
    topicId: "security",
    type: "short-answer",
    question: "Name one method of two-factor authentication (2FA).",
    correctAnswer: "SMS code",
    acceptableAnswers: ["SMS code", "text message", "authenticator app", "fingerprint", "biometric", "email code", "security key", "token", "face recognition", "one-time code"],
    explanation: "Two-factor authentication requires two different types of verification: something you know (password), something you have (phone/token), or something you are (biometrics).",
    difficulty: "easy",
    subtopicLabel: "8.2 Threat mitigation",
  },
  {
    id: "q-sec-3",
    topicId: "security",
    type: "multiple-choice",
    question: "What does encryption do to data?",
    options: [
      "Deletes it permanently",
      "Converts it into an unreadable format",
      "Compresses it to save space",
      "Creates a backup copy",
    ],
    correctAnswer: "Converts it into an unreadable format",
    explanation: "Encryption scrambles data into ciphertext using an algorithm and key, making it unreadable to anyone without the correct decryption key.",
    difficulty: "easy",
    subtopicLabel: "8.2 Threat mitigation",
  },
];

/* ─── Props ─── */

interface QuickQuizProps {
  topicId?: string;
  onClose?: () => void;
}

/* ─── Helpers ─── */

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function checkShortAnswer(answer: string, question: QuizQuestion): boolean {
  const normalised = answer.trim().toLowerCase();
  if (!normalised) return false;

  const correct = question.correctAnswer.toLowerCase();
  if (normalised.includes(correct) || correct.includes(normalised)) return true;

  for (const alt of question.acceptableAnswers ?? []) {
    const altLower = alt.toLowerCase();
    if (normalised.includes(altLower) || altLower.includes(normalised)) return true;
  }

  return false;
}

const difficultyColor = {
  easy: "text-success bg-success/10",
  medium: "text-warning bg-warning/10",
  hard: "text-danger bg-danger/10",
};

const typeIcon = {
  "multiple-choice": Zap,
  "short-answer": MessageSquare,
  "true-false": CheckCircle2,
};

/* ─── Component ─── */

export function QuickQuiz({ topicId, onClose }: QuickQuizProps) {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(topicId ?? null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const questions = useMemo(() => {
    const filtered = selectedTopicId
      ? QUIZ_BANK.filter((q) => q.topicId === selectedTopicId)
      : QUIZ_BANK;
    return shuffleArray(filtered).slice(0, 8);
  }, [selectedTopicId]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const progressPct = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const handleSelectAnswer = useCallback((answer: string) => {
    if (hasSubmitted) return;
    setSelectedAnswer(answer);
  }, [hasSubmitted]);

  const handleSubmitAnswer = useCallback(() => {
    if (!currentQuestion || hasSubmitted) return;

    let isCorrect = false;

    if (currentQuestion.type === "short-answer") {
      isCorrect = checkShortAnswer(typedAnswer, currentQuestion);
    } else {
      isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    }

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setHasSubmitted(true);
    setAnsweredCount((prev) => prev + 1);
  }, [currentQuestion, hasSubmitted, selectedAnswer, typedAnswer]);

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= totalQuestions) {
      setQuizFinished(true);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setSelectedAnswer(null);
    setTypedAnswer("");
    setHasSubmitted(false);
  }, [currentIndex, totalQuestions]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setTypedAnswer("");
    setHasSubmitted(false);
    setScore(0);
    setAnsweredCount(0);
    setQuizFinished(false);
    setQuizStarted(false);
    setSelectedTopicId(topicId ?? null);
  }, [topicId]);

  function startQuiz(topic?: string) {
    if (topic) setSelectedTopicId(topic);
    setQuizStarted(true);
  }

  const isCorrect = hasSubmitted && (
    currentQuestion?.type === "short-answer"
      ? checkShortAnswer(typedAnswer, currentQuestion)
      : selectedAnswer === currentQuestion?.correctAnswer
  );

  /* ─── Topic selection view ─── */
  if (!quizStarted) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
            <Zap size={12} />
            Quick Quiz
          </div>
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            Test yourself with quick questions
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
            Multiple choice, true/false, and short answer questions drawn from the
            T-Level DSD curriculum. Pick a topic or quiz across all of them.
          </p>
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => startQuiz()}
            className="rounded-2xl border border-accent/30 bg-accent/10 px-6 py-4 text-left transition-all hover:border-accent/50 hover:bg-accent/15 hover:shadow-[0_0_24px_-8px_rgba(139,92,246,0.3)] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15">
                <Sparkles size={20} className="text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">All Topics Mix</p>
                <p className="text-xs text-muted-foreground">{QUIZ_BANK.length} questions across all topics</p>
              </div>
            </div>
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {TOPICS.filter((t) => t.id !== "esp").map((topic) => {
            const count = QUIZ_BANK.filter((q) => q.topicId === topic.id).length;
            if (count === 0) return null;
            return (
              <button
                key={topic.id}
                onClick={() => startQuiz(topic.id)}
                className="rounded-2xl border border-border bg-surface/40 px-4 py-4 text-left transition-all hover:border-accent/20 hover:bg-card/80 hover:shadow-[0_4px_16px_-4px_rgba(139,92,246,0.1)] cursor-pointer group"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-card text-lg group-hover:border-accent/20 transition-colors">
                      {topic.icon}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{topic.label}</p>
                      <p className="text-xs text-muted-foreground">{count} questions</p>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  /* ─── Quiz finished view ─── */
  if (quizFinished) {
    const scorePct = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const variant = scorePct >= 70 ? "success" : scorePct >= 40 ? "warning" : "danger";
    const topicInfo = selectedTopicId ? TOPICS.find((t) => t.id === selectedTopicId) : null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto max-w-lg text-center space-y-6 py-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        >
          <Trophy size={56} className={cn("mx-auto", scorePct >= 70 ? "text-success" : scorePct >= 40 ? "text-warning" : "text-danger")} />
        </motion.div>

        <div>
          <h2 className="text-2xl font-bold text-foreground">Quiz Complete!</h2>
          <p className="text-sm text-muted mt-1">
            {topicInfo ? `${topicInfo.icon} ${topicInfo.label}` : "All Topics Mix"}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface/40 p-6 space-y-4">
          <div className="text-5xl font-bold tabular-nums" style={{ color: `var(--color-${variant})` }}>
            {score}/{totalQuestions}
          </div>
          <ProgressBar value={scorePct} className="mx-auto max-w-xs" />
          <p className="text-sm text-muted">
            {scorePct >= 80
              ? "Great job! You know this material well."
              : scorePct >= 60
              ? "Good effort. A few areas to review."
              : scorePct >= 40
              ? "Keep going. Focus on the topics you got wrong."
              : "This needs more revision. Don't worry \u2014 practice helps."}
          </p>
        </div>

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

  if (!currentQuestion) return null;

  const TypeIcon = typeIcon[currentQuestion.type];
  const topicInfo = TOPICS.find((t) => t.id === currentQuestion.topicId);

  /* ─── Active question view ─── */
  return (
    <div className="space-y-5">
      {/* Progress bar + score */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <ProgressBar value={progressPct} size="sm" />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-muted-foreground tabular-nums">
            {currentIndex + 1}/{totalQuestions}
          </span>
          <Badge variant="accent">
            {score} correct
          </Badge>
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
          {/* Question card */}
          <div className="rounded-2xl border border-border bg-surface/30 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="flex items-center gap-1.5">
                <span className="text-base">{topicInfo?.icon}</span>
                <span className="text-xs text-muted-foreground font-medium">{topicInfo?.label}</span>
              </div>
              {currentQuestion.subtopicLabel && (
                <>
                  <span className="text-muted-foreground/30">/</span>
                  <span className="text-xs text-muted-foreground">{currentQuestion.subtopicLabel}</span>
                </>
              )}
              <span className={cn("ml-auto px-2 py-0.5 rounded-lg text-[10px] font-medium", difficultyColor[currentQuestion.difficulty])}>
                {currentQuestion.difficulty}
              </span>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-border/30 text-[10px] text-muted-foreground font-medium">
                <TypeIcon size={10} />
                {currentQuestion.type === "multiple-choice" ? "MC" : currentQuestion.type === "true-false" ? "T/F" : "Written"}
              </div>
            </div>

            <h3 className="text-lg font-semibold text-foreground leading-relaxed">
              {currentQuestion.question}
            </h3>
          </div>

          {/* Answer area */}
          <div className="space-y-2.5">
            {currentQuestion.type === "multiple-choice" && currentQuestion.options && (
              currentQuestion.options.map((option, i) => {
                const isSelected = selectedAnswer === option;
                const isCorrectOption = option === currentQuestion.correctAnswer;
                const letter = String.fromCharCode(65 + i);

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
                      "w-full rounded-xl border px-4 py-3.5 text-left transition-all cursor-pointer disabled:cursor-default",
                      borderClass,
                      bgClass
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold shrink-0",
                        hasSubmitted && isCorrectOption
                          ? "bg-success/20 text-success"
                          : hasSubmitted && isSelected && !isCorrectOption
                          ? "bg-danger/20 text-danger"
                          : isSelected
                          ? "bg-accent/20 text-accent"
                          : "bg-border/50 text-muted-foreground"
                      )}>
                        {hasSubmitted && isCorrectOption ? (
                          <CheckCircle2 size={14} />
                        ) : hasSubmitted && isSelected && !isCorrectOption ? (
                          <XCircle size={14} />
                        ) : (
                          letter
                        )}
                      </span>
                      <span className={cn("text-sm", hasSubmitted && !isCorrectOption && !isSelected ? "text-muted-foreground" : "text-foreground")}>
                        {option}
                      </span>
                    </div>
                  </button>
                );
              })
            )}

            {currentQuestion.type === "true-false" && (
              <div className="grid grid-cols-2 gap-3">
                {["True", "False"].map((option) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrectOption = option === currentQuestion.correctAnswer;

                  let borderClass = "border-border hover:border-accent/20";
                  let bgClass = "bg-surface/40 hover:bg-card/80";

                  if (hasSubmitted) {
                    if (isCorrectOption) {
                      borderClass = "border-success/40";
                      bgClass = "bg-success/10";
                    } else if (isSelected) {
                      borderClass = "border-danger/40";
                      bgClass = "bg-danger/10";
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
                        "rounded-xl border px-4 py-4 text-center transition-all cursor-pointer disabled:cursor-default",
                        borderClass,
                        bgClass
                      )}
                    >
                      <span className="text-sm font-semibold text-foreground">{option}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {currentQuestion.type === "short-answer" && (
              <div className="space-y-3">
                <textarea
                  value={typedAnswer}
                  onChange={(e) => { if (!hasSubmitted) setTypedAnswer(e.target.value); }}
                  disabled={hasSubmitted}
                  rows={3}
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
                  <div className="rounded-xl border border-border bg-card/60 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Expected answer
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {currentQuestion.correctAnswer}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Explanation (after submit) */}
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
              <div className="flex items-center gap-2 mb-2">
                {isCorrect ? (
                  <CheckCircle2 size={16} className="text-success" />
                ) : (
                  <XCircle size={16} className="text-danger" />
                )}
                <span className={cn("text-sm font-semibold", isCorrect ? "text-success" : "text-danger")}>
                  {isCorrect ? "Correct!" : "Not quite"}
                </span>
              </div>
              <p className="text-sm text-muted leading-relaxed">
                {currentQuestion.explanation}
              </p>
            </motion.div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" size="sm" onClick={onClose ?? handleRestart}>
              {onClose ? "Exit Quiz" : "Restart"}
            </Button>

            {!hasSubmitted ? (
              <Button
                onClick={handleSubmitAnswer}
                disabled={currentQuestion.type === "short-answer" ? !typedAnswer.trim() : !selectedAnswer}
              >
                Check Answer
              </Button>
            ) : (
              <Button onClick={handleNext}>
                {currentIndex + 1 >= totalQuestions ? "See Results" : "Next Question"}
                <ArrowRight size={14} />
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
