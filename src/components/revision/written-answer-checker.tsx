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
import { Badge, Button, ProgressBar } from "@/components/ui";
import { getPracticeQuestionForTopic } from "@/lib/intelligence/catalog";
import type { RevisionAnswerEvaluation } from "@/lib/intelligence/types";

interface WrittenAnswerCheckerProps {
  topicId: string;
  topicLabel: string;
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
      <div className="text-center py-12">
        <ClipboardList size={40} className="text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-sm text-muted-foreground mb-2">
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

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-surface/30 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BrainCircuit size={15} className="text-accent" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Structured Answer Check
              </span>
            </div>
            <h3 className="text-base font-semibold text-foreground leading-relaxed">
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
              className="rounded-xl border border-border bg-card/60 px-3 py-3 text-xs text-muted-foreground leading-relaxed"
            >
              {point}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/70 p-4">
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
            {result ? "Re-check answer" : "Check answer"}
          </Button>
        </div>
      </div>

      {result && (
        <div className="space-y-4 rounded-2xl border border-border bg-surface/20 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-success" />
                <span className="text-sm font-semibold text-foreground">
                  Score {result.score}/{result.maxScore}
                </span>
                <Badge variant={scorePercent >= 70 ? "success" : scorePercent >= 40 ? "warning" : "danger"}>
                  {scorePercent}%
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {result.feedback}
              </p>
            </div>
            <div className="min-w-[180px] space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Confidence</span>
                <span>{Math.round(result.confidence * 100)}%</span>
              </div>
              <ProgressBar value={Math.round(result.confidence * 100)} size="sm" />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <Sparkles size={12} className="text-success" />
                Matched Concepts
              </div>
              <div className="flex flex-wrap gap-2">
                {result.matchedConcepts.length ? (
                  result.matchedConcepts.map((concept) => (
                    <Badge key={concept} variant="success">
                      {concept}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">No clear mark-scheme matches yet.</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <Target size={12} className="text-warning" />
                Missing Concepts
              </div>
              <div className="flex flex-wrap gap-2">
                {result.missingConcepts.length ? (
                  result.missingConcepts.map((concept) => (
                    <Badge key={concept} variant="warning">
                      {concept}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">No major gaps detected.</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <AlertCircle size={12} className="text-danger" />
                Misconceptions
              </div>
              <div className="flex flex-wrap gap-2">
                {result.misconceptions.length ? (
                  result.misconceptions.map((item) => (
                    <Badge key={item} variant="danger">
                      {item}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">No flagged misconception signals.</span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Concept Breakdown
            </div>
            <div className="space-y-2">
              {result.conceptBreakdown.map((concept) => (
                <div
                  key={concept.id}
                  className="rounded-xl border border-border bg-card/60 px-4 py-3"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{concept.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {concept.scoreAwarded}/{concept.maxScore} marks
                      </p>
                    </div>
                    <div className="min-w-[160px]">
                      <ProgressBar value={Math.round(concept.coverage * 100)} size="sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
