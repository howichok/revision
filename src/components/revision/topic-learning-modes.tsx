"use client";
import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  ClipboardList,
  Sparkles,
  Target,
} from "lucide-react";
import { Badge, Button, Card, ProgressBar } from "@/components/ui";
import type {
  PracticeExamDrill,
  PracticeRecallCard,
  PracticeResourceStep,
} from "@/lib/practice";
import { LearningOutcomePanel } from "@/components/revision/learning-outcome-panel";

type RecallRating = "again" | "almost" | "got-it";
type ExamRating = "needs-work" | "ready";

const RECALL_SCORES: Record<RecallRating, number> = {
  again: 25,
  almost: 70,
  "got-it": 100,
};

const EXAM_SCORES: Record<ExamRating, number> = {
  "needs-work": 35,
  ready: 100,
};

function getAveragePercent<T extends string>(
  ids: string[],
  ratings: Record<string, T>,
  scoreMap: Record<T, number>
) {
  if (ids.length === 0) {
    return 0;
  }

  const total = ids.reduce((sum, id) => sum + (ratings[id] ? scoreMap[ratings[id]] : 0), 0);
  return Math.round(total / ids.length);
}

function getRatedCount<T extends string>(ratings: Record<string, T>) {
  return Object.keys(ratings).length;
}

function findFirstUnratedIndex<T extends { id: string }>(
  items: T[],
  ratings: Record<string, string>
) {
  return items.findIndex((item) => !ratings[item.id]);
}

function toSentenceCase(value: string) {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function ResourceStepCard({
  label,
  title,
  summary,
  kind,
  why,
}: {
  label: string;
  title: string;
  summary: string;
  kind: string;
  why: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface/30 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            {label}
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{summary}</p>
        </div>
        <Badge
          variant={
            kind === "mark-scheme"
              ? "warning"
              : kind === "past-paper" || kind === "question-bank"
                ? "accent"
                : "default"
          }
        >
          {kind.replace("-", " ")}
        </Badge>
      </div>
      <p className="mt-3 text-xs text-muted-foreground/80">{why}</p>
    </div>
  );
}

export function TopicSupportResourcesCard({
  title,
  description,
  resourceSteps,
}: {
  title: string;
  description: string;
  resourceSteps: PracticeResourceStep[];
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Sparkles size={15} className="text-accent" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>

      <div className="mt-5 space-y-3">
        {resourceSteps.map((step) =>
          step.resource ? (
            <ResourceStepCard
              key={step.id}
              label={step.label}
              title={step.resource.title}
              summary={step.resource.summary}
              kind={step.resource.kind}
              why={step.why}
            />
          ) : (
            <div
              key={step.id}
              className="rounded-2xl border border-dashed border-border bg-surface/20 px-4 py-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {step.label}
              </p>
              <p className="mt-2 text-sm text-foreground">No mapped resource yet</p>
              <p className="mt-2 text-xs text-muted-foreground">{step.why}</p>
            </div>
          )
        )}

        <div className="rounded-2xl border border-warning/20 bg-warning/10 px-4 py-4">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-warning" />
            <p className="text-sm font-medium text-foreground">Best next step</p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Use support material after you see a real gap, not before you try recalling or planning the answer yourself.
          </p>
        </div>
      </div>
    </Card>
  );
}

export function RecallPanel({
  topicId,
  cards,
  progressPercent,
  onComplete,
}: {
  topicId: string;
  cards: PracticeRecallCard[];
  progressPercent: number;
  onComplete: (percent: number) => Promise<unknown>;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [ratings, setRatings] = useState<Record<string, RecallRating>>({});
  const [sessionComplete, setSessionComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const currentCard = cards[currentIndex] ?? null;
  const ratedCount = getRatedCount(ratings);
  const roundPercent =
    cards.length > 0 ? Math.round((ratedCount / cards.length) * 100) : 0;
  const masteryPercent = getAveragePercent(
    cards.map((card) => card.id),
    ratings,
    RECALL_SCORES
  );

  async function handleRateCard(rating: RecallRating) {
    if (!currentCard) {
      return;
    }

    const nextRatings = {
      ...ratings,
      [currentCard.id]: rating,
    };
    const nextRatedCount = getRatedCount(nextRatings);
    const nextIndex = findFirstUnratedIndex(cards, nextRatings);
    const nextMastery = getAveragePercent(
      cards.map((card) => card.id),
      nextRatings,
      RECALL_SCORES
    );

    setRatings(nextRatings);
    setError("");

    if (nextRatedCount >= cards.length || nextIndex === -1) {
      setSessionComplete(true);
      setRevealed(false);
      setIsSaving(true);

      try {
        await onComplete(nextMastery);
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Unable to save recall progress."
        );
      } finally {
        setIsSaving(false);
      }

      return;
    }

    setCurrentIndex(nextIndex);
    setRevealed(false);
  }

  function handleRestart() {
    setCurrentIndex(0);
    setRevealed(false);
    setRatings({});
    setSessionComplete(false);
    setIsSaving(false);
    setError("");
  }

  if (cards.length === 0) {
    return (
      <Card className="p-5">
        <p className="text-sm text-muted-foreground">
          No structured recall cards are mapped for this topic yet.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BrainCircuit size={15} className="text-accent" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Active Recall
              </span>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-foreground">
              Recall cycle
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Recall the idea before revealing it, then rate how well you could actually bring it back without help.
            </p>
          </div>
          <div className="space-y-2 text-right">
            <Badge variant={progressPercent >= 70 ? "success" : progressPercent >= 40 ? "warning" : "default"}>
              Saved {progressPercent}%
            </Badge>
            <p className="text-xs text-muted-foreground">{cards.length} cards mapped</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface/30 px-4 py-3">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              <span>Round progress</span>
              <span>{roundPercent}%</span>
            </div>
            <ProgressBar value={roundPercent} className="mt-3" size="sm" />
          </div>
          <div className="rounded-2xl border border-border bg-surface/30 px-4 py-3">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              <span>Current mastery</span>
              <span>{masteryPercent}%</span>
            </div>
            <ProgressBar value={masteryPercent} className="mt-3" size="sm" />
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </div>
        )}
      </Card>

      {!sessionComplete && currentCard ? (
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <Badge variant="accent">
              Card {currentIndex + 1} / {cards.length}
            </Badge>
            <Badge variant={currentCard.kind === "term" ? "success" : "default"}>
              {currentCard.kind === "term" ? "Term" : "Curriculum point"}
            </Badge>
          </div>

          <h4 className="mt-4 text-xl font-semibold text-foreground">
            {currentCard.title}
          </h4>
          <p className="mt-3 text-sm leading-relaxed text-foreground/90">
            {currentCard.prompt}
          </p>

          {currentCard.hint && (
            <p className="mt-3 text-xs text-muted-foreground">
              Hint: {currentCard.hint}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {currentCard.tags.slice(0, 4).map((tag) => (
              <span
                key={`${currentCard.id}-${tag}`}
                className="rounded-lg border border-border bg-surface/20 px-2.5 py-1 text-[11px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>

          {revealed ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-success/20 bg-success/10 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-success">
                  Model answer
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">
                  {currentCard.answer}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Next: {currentCard.nextStep}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => void handleRateCard("again")}
                  disabled={isSaving}
                >
                  Repeat this card
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => void handleRateCard("almost")}
                  disabled={isSaving}
                >
                  Mostly recalled it
                </Button>
                <Button
                  onClick={() => void handleRateCard("got-it")}
                  isLoading={isSaving}
                >
                  I could recall this confidently
                  <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Try to say the answer aloud before revealing it.
              </p>
              <Button onClick={() => setRevealed(true)}>Reveal answer</Button>
            </div>
          )}
        </Card>
      ) : (
        <LearningOutcomePanel
          eyebrow="Active Recall"
          title="Recall round complete"
          summary={`You rated ${cards.length} cards. Use the mastery signal to decide whether you should move into written answers or repeat the deck.`}
          tone={
            masteryPercent >= 70
              ? "success"
              : masteryPercent >= 40
                ? "warning"
                : "danger"
          }
          progressLabel="Current mastery"
          progressValue={masteryPercent}
          badges={[
            {
              label:
                masteryPercent >= 70
                  ? "Strong recall"
                  : masteryPercent >= 40
                    ? "Partial recall"
                    : "Needs repetition",
              variant:
                masteryPercent >= 70
                  ? "success"
                  : masteryPercent >= 40
                    ? "warning"
                    : "danger",
            },
          ]}
          primaryAction={{
            label: "Check a written answer next",
            href: `/revision/${topicId}/answer-check`,
          }}
          secondaryAction={{
            label: "Run the recall cycle again",
            onClick: handleRestart,
            variant: "secondary",
          }}
        />
      )}
    </div>
  );
}

export function ExamDrillPanel({
  topicId,
  drills,
  progressPercent,
  onComplete,
}: {
  topicId: string;
  drills: PracticeExamDrill[];
  progressPercent: number;
  onComplete: (percent: number) => Promise<unknown>;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showChecklist, setShowChecklist] = useState(false);
  const [notes, setNotes] = useState("");
  const [ratings, setRatings] = useState<Record<string, ExamRating>>({});
  const [sessionComplete, setSessionComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const currentDrill = drills[currentIndex] ?? null;
  const ratedCount = getRatedCount(ratings);
  const roundPercent =
    drills.length > 0 ? Math.round((ratedCount / drills.length) * 100) : 0;
  const readinessPercent = getAveragePercent(
    drills.map((drill) => drill.id),
    ratings,
    EXAM_SCORES
  );

  async function handleRateDrill(rating: ExamRating) {
    if (!currentDrill) {
      return;
    }

    const nextRatings = {
      ...ratings,
      [currentDrill.id]: rating,
    };
    const nextRatedCount = getRatedCount(nextRatings);
    const nextIndex = findFirstUnratedIndex(drills, nextRatings);
    const nextReadiness = getAveragePercent(
      drills.map((drill) => drill.id),
      nextRatings,
      EXAM_SCORES
    );

    setRatings(nextRatings);
    setNotes("");
    setError("");

    if (nextRatedCount >= drills.length || nextIndex === -1) {
      setSessionComplete(true);
      setShowChecklist(false);
      setIsSaving(true);

      try {
        await onComplete(nextReadiness);
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Unable to save exam drill progress."
        );
      } finally {
        setIsSaving(false);
      }

      return;
    }

    setCurrentIndex(nextIndex);
    setShowChecklist(false);
  }

  function handleRestart() {
    setCurrentIndex(0);
    setShowChecklist(false);
    setNotes("");
    setRatings({});
    setSessionComplete(false);
    setIsSaving(false);
    setError("");
  }

  if (drills.length === 0) {
    return (
      <Card className="p-5">
        <p className="text-sm text-muted-foreground">
          No mapped exam-style drills are available for this topic yet.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList size={15} className="text-warning" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Guided Exam Practice
              </span>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-foreground">
              Exam drill
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              This mode helps you plan and self-check exam responses. It does not produce a formal score.
            </p>
          </div>
          <div className="space-y-2 text-right">
            <Badge variant={progressPercent >= 70 ? "success" : progressPercent >= 40 ? "warning" : "default"}>
              Saved {progressPercent}%
            </Badge>
            <p className="text-xs text-muted-foreground">{drills.length} exam prompts mapped</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface/30 px-4 py-3">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              <span>Round progress</span>
              <span>{roundPercent}%</span>
            </div>
            <ProgressBar value={roundPercent} className="mt-3" size="sm" />
          </div>
          <div className="rounded-2xl border border-border bg-surface/30 px-4 py-3">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              <span>Readiness signal</span>
              <span>{readinessPercent}%</span>
            </div>
            <ProgressBar value={readinessPercent} className="mt-3" size="sm" />
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </div>
        )}
      </Card>

      {!sessionComplete && currentDrill ? (
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent">
              Prompt {currentIndex + 1} / {drills.length}
            </Badge>
            <Badge variant="default">{currentDrill.sourceLabel}</Badge>
            {currentDrill.marks && (
              <Badge variant="warning">{currentDrill.marks} marks</Badge>
            )}
          </div>

          <h4 className="mt-4 text-lg font-semibold text-foreground">
            {currentDrill.title}
          </h4>
          <p className="mt-3 text-sm leading-relaxed text-foreground/90">
            {currentDrill.prompt}
          </p>

          <div className="mt-4 rounded-2xl border border-border bg-surface/20 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Plan before you compare
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Outline the structure you would use, the key ideas to include, and one example or consequence you would mention.
            </p>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={5}
              placeholder="Plan your answer here..."
              className="mt-3 w-full rounded-2xl border border-border bg-card/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          </div>

          {showChecklist ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-success/20 bg-success/10 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-success">
                  Mark-scheme checklist
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">
                  {currentDrill.answerFocus}
                </p>
                <div className="mt-4 space-y-2">
                  {currentDrill.checklist.map((item) => (
                    <div
                      key={`${currentDrill.id}-${item}`}
                      className="rounded-xl border border-border bg-card/60 px-3 py-2.5 text-xs text-foreground/90"
                    >
                      {toSentenceCase(item)}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => void handleRateDrill("needs-work")}
                  disabled={isSaving}
                >
                  Review feedback and retry this prompt
                </Button>
                <Button
                  onClick={() => void handleRateDrill("ready")}
                  isLoading={isSaving}
                >
                  Continue to next exam prompt
                  <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Use the checklist only after you have planned the answer yourself.
              </p>
              <Button onClick={() => setShowChecklist(true)}>
                Show mark-scheme checklist
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <LearningOutcomePanel
          eyebrow="Guided Exam Practice"
          title="Exam drill round complete"
          summary={`You worked through ${drills.length} exam prompts. Use the readiness signal to decide whether to move into answer checking or repeat more guided planning.`}
          tone={
            readinessPercent >= 70
              ? "success"
              : readinessPercent >= 40
                ? "warning"
                : "danger"
          }
          progressLabel="Readiness signal"
          progressValue={readinessPercent}
          badges={[
            {
              label:
                readinessPercent >= 70
                  ? "Ready for exam wording"
                  : readinessPercent >= 40
                    ? "Some gaps remain"
                    : "Needs guided review",
              variant:
                readinessPercent >= 70
                  ? "success"
                  : readinessPercent >= 40
                    ? "warning"
                    : "danger",
            },
          ]}
          primaryAction={{
            label: "Check this topic against the mark scheme",
            href: `/revision/${topicId}/answer-check`,
          }}
          secondaryAction={{
            label: "Run another exam drill round",
            onClick: handleRestart,
            variant: "secondary",
          }}
        />
      )}
    </div>
  );
}
