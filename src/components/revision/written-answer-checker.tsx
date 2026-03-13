"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  Sparkles,
  Target,
} from "lucide-react";
import { Badge, Button, Card, ProgressBar } from "@/components/ui";
import { getPracticeQuestionForTopic } from "@/lib/intelligence/catalog";
import type { RevisionAnswerEvaluation } from "@/lib/intelligence/types";

interface WrittenAnswerCheckerProps {
  topicId: string;
  topicLabel: string;
}

function getScoreTone(scorePercent: number) {
  if (scorePercent >= 70) {
    return "success" as const;
  }

  if (scorePercent >= 40) {
    return "warning" as const;
  }

  return "danger" as const;
}

export function WrittenAnswerChecker({
  topicId,
  topicLabel,
}: WrittenAnswerCheckerProps) {
  const question = useMemo(() => getPracticeQuestionForTopic(topicId), [topicId]);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<RevisionAnswerEvaluation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDirtySinceLastCheck, setIsDirtySinceLastCheck] = useState(false);

  useEffect(() => {
    setAnswer("");
    setResult(null);
    setError("");
    setIsDirtySinceLastCheck(false);
  }, [question?.id]);

  async function handleEvaluate() {
    if (!question || !answer.trim()) {
      setError("Write a short answer before running the checker.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/intelligence/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "revision-answer",
          questionId: question.id,
          answer,
        }),
      });

      const payload = (await response.json()) as
        | RevisionAnswerEvaluation
        | { error?: string };
      const errorMessage = "error" in payload ? payload.error : undefined;

      if (!response.ok || errorMessage) {
        throw new Error(errorMessage ?? "Unable to evaluate the answer right now.");
      }

      setResult(payload as RevisionAnswerEvaluation);
      setIsDirtySinceLastCheck(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to evaluate the answer right now."
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (!question) {
    return (
      <div className="py-12 text-center">
        <ClipboardList
          size={40}
          className="mx-auto mb-3 text-muted-foreground opacity-50"
        />
        <p className="mb-2 text-sm text-muted-foreground">
          Structured written checks are being prepared for {topicLabel}.
        </p>
        <p className="text-xs text-muted-foreground/70">
          The intelligence engine is ready, but this topic does not have a public practice prompt yet.
        </p>
      </div>
    );
  }

  const scorePercent = result
    ? Math.round((result.score / result.maxScore) * 100)
    : 0;
  const scoreTone = getScoreTone(scorePercent);

  return (
    <div className="space-y-5">
      <Card variant="task" className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BrainCircuit size={15} className="text-accent" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Structured Answer Check
              </span>
            </div>
            <h3 className="text-base font-semibold leading-relaxed text-foreground">
              {question.prompt}
            </h3>
            <p className="text-xs text-muted-foreground">
              Deterministic concept matching with fuzzy phrase detection, misconception checks, and explainable feedback.
            </p>
          </div>
          <Badge variant="accent">{question.maxScore} marks</Badge>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {question.rubricSummary.map((point) => (
            <div
              key={point}
              className="rounded-xl border border-white/8 bg-black/20 px-3 py-3 text-xs leading-relaxed text-muted-foreground"
            >
              {point}
            </div>
          ))}
        </div>
      </Card>

      <Card variant="input" className="p-4">
        <label
          htmlFor={`written-answer-${question.id}`}
          className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
        >
          Your Answer
        </label>
        <textarea
          id={`written-answer-${question.id}`}
          value={answer}
          onChange={(event) => {
            setAnswer(event.target.value);
            setError("");
            if (result) {
              setIsDirtySinceLastCheck(true);
            }
          }}
          rows={7}
          placeholder="Write a short structured answer. Mention the concept, explain it, and link it to the scenario."
          className="min-h-[176px] w-full rounded-2xl border border-border bg-surface/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
        />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            {error ? (
              <div className="flex items-center gap-2 text-sm text-danger">
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </div>
            ) : isDirtySinceLastCheck ? (
              <p className="text-xs text-warning">
                Your answer changed after the last check. Run it again to refresh the score.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                The current engine is explainable and deterministic. It is not using a hosted AI model.
              </p>
            )}
            <p className="text-[11px] text-muted-foreground/70">
              {answer.trim().split(/\s+/).filter(Boolean).length} words
            </p>
          </div>
          <Button onClick={() => void handleEvaluate()} isLoading={isLoading}>
            {result
              ? "Check this answer again"
              : "Check this answer against the mark scheme"}
          </Button>
        </div>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card variant={scoreTone} className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    size={15}
                    className={
                      scoreTone === "success"
                        ? "text-success"
                        : scoreTone === "warning"
                          ? "text-warning"
                          : "text-danger"
                    }
                  />
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Analytical result
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-2xl font-semibold text-foreground">
                    Score {result.score}/{result.maxScore}
                  </span>
                  <Badge variant={scoreTone}>{scorePercent}%</Badge>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {result.feedback}
                </p>
              </div>

              <div className="grid min-w-[220px] gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Confidence
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {Math.round(result.confidence * 100)}%
                  </p>
                  <ProgressBar
                    value={Math.round(result.confidence * 100)}
                    size="sm"
                    className="mt-3"
                    color={
                      scoreTone === "danger"
                        ? "danger"
                        : scoreTone === "warning"
                          ? "warning"
                          : "success"
                    }
                  />
                </div>

                <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Mark-scheme coverage
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {result.matchedConcepts.length}/{result.conceptBreakdown.length}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    concepts clearly matched
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card variant="success" className="p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <Sparkles size={12} className="text-success" />
                Matched concepts
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.matchedConcepts.length ? (
                  result.matchedConcepts.map((concept) => (
                    <Badge key={concept} variant="success">
                      {concept}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">
                    No clear mark-scheme matches yet.
                  </span>
                )}
              </div>
            </Card>

            <Card variant="warning" className="p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <Target size={12} className="text-warning" />
                Still missing
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.missingConcepts.length ? (
                  result.missingConcepts.map((concept) => (
                    <Badge key={concept} variant="warning">
                      {concept}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">
                    No major gaps detected.
                  </span>
                )}
              </div>
            </Card>

            <Card
              variant={result.misconceptions.length ? "danger" : "support"}
              className="p-4"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <AlertCircle
                  size={12}
                  className={
                    result.misconceptions.length ? "text-danger" : "text-muted-foreground"
                  }
                />
                Misconceptions
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.misconceptions.length ? (
                  result.misconceptions.map((item) => (
                    <Badge key={item} variant="danger">
                      {item}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">
                    No flagged misconception signals.
                  </span>
                )}
              </div>
            </Card>
          </div>

          <Card variant="support" className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Concept breakdown
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  See how each marking idea was scored instead of treating the result like one opaque number.
                </p>
              </div>
              <Badge variant="default">{result.conceptBreakdown.length} concepts</Badge>
            </div>

            <div className="mt-4 space-y-3">
              {result.conceptBreakdown.map((concept) => {
                const tone =
                  concept.coverage >= 0.9
                    ? "success"
                    : concept.coverage > 0
                      ? "warning"
                      : "danger";

                return (
                  <Card key={concept.id} variant={tone} className="px-4 py-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {concept.label}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {concept.scoreAwarded}/{concept.maxScore} marks
                          </p>
                        </div>

                        {concept.matchedEvidence.length > 0 && (
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                              Evidence found
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {concept.matchedEvidence.map((evidence) => (
                                <span
                                  key={`${concept.id}-${evidence}`}
                                  className="rounded-lg border border-white/8 bg-black/20 px-2.5 py-1 text-[11px] text-foreground/90"
                                >
                                  {evidence}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {concept.missingEvidence.length > 0 && (
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                              Still missing
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {concept.missingEvidence.slice(0, 3).map((evidence) => (
                                <span
                                  key={`${concept.id}-missing-${evidence}`}
                                  className="rounded-lg border border-white/8 bg-black/20 px-2.5 py-1 text-[11px] text-muted-foreground"
                                >
                                  {evidence}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="min-w-[180px] space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Coverage</span>
                          <span>{Math.round(concept.coverage * 100)}%</span>
                        </div>
                        <ProgressBar
                          value={Math.round(concept.coverage * 100)}
                          size="sm"
                          color={
                            tone === "danger"
                              ? "danger"
                              : tone === "warning"
                                ? "warning"
                                : "success"
                          }
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
