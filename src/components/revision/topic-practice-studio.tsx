"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react";
import { useAppData } from "@/components/providers/app-data-provider";
import { Button, Card, ProgressBar, Badge } from "@/components/ui";
import {
  getPracticeSetId,
  getTopicPracticeBundle,
  type PracticeExamDrill,
  type PracticeRecallCard,
} from "@/lib/practice";
import { getPracticeSetProgress } from "@/lib/progress";
import { WrittenAnswerChecker } from "./written-answer-checker";
import { QuickQuiz } from "./quick-quiz";

interface TopicPracticeStudioProps {
  topicId: string;
  topicLabel: string;
}

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

function toSentenceCase(value: string) {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

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
        <Badge variant={kind === "mark-scheme" ? "warning" : kind === "past-paper" || kind === "question-bank" ? "accent" : "default"}>
          {kind.replace("-", " ")}
        </Badge>
      </div>
      <p className="mt-3 text-xs text-muted-foreground/80">{why}</p>
    </div>
  );
}

function RecallPanel({
  cards,
  progressPercent,
  onComplete,
}: {
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
            Try to explain the idea before revealing the answer, then mark how well you actually knew it.
          </p>
        </div>
        <div className="space-y-2 text-right">
          <Badge variant={progressPercent >= 70 ? "success" : progressPercent >= 40 ? "warning" : "default"}>
            Saved {progressPercent}%
          </Badge>
          <p className="text-xs text-muted-foreground">
            {cards.length} cards in this deck
          </p>
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

      {!sessionComplete && currentCard ? (
        <div className="mt-5 rounded-[24px] border border-border bg-card/70 p-5">
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
                  Need another round
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => void handleRateCard("almost")}
                  disabled={isSaving}
                >
                  Almost there
                </Button>
                <Button
                  onClick={() => void handleRateCard("got-it")}
                  isLoading={isSaving}
                >
                  Got it
                  <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Say the answer aloud or write it mentally before revealing it.
              </p>
              <Button onClick={() => setRevealed(true)}>
                Reveal answer
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-5 rounded-[24px] border border-border bg-surface/20 px-5 py-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-success" />
            <p className="text-sm font-semibold text-foreground">
              Recall round complete
            </p>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            You rated {cards.length} cards. Current mastery for this round: {masteryPercent}%.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleRestart}>
              <RotateCcw size={14} />
              Run again
            </Button>
            <Badge variant={masteryPercent >= 70 ? "success" : masteryPercent >= 40 ? "warning" : "danger"}>
              {masteryPercent >= 70 ? "Strong recall" : masteryPercent >= 40 ? "Partial recall" : "Needs repetition"}
            </Badge>
          </div>
        </div>
      )}
    </Card>
  );
}

function ExamDrillPanel({
  drills,
  progressPercent,
  onComplete,
}: {
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
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList size={15} className="text-warning" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Guided Practice
            </span>
          </div>
          <h3 className="mt-2 text-lg font-semibold text-foreground">
            Exam drill
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Plan an answer first, then reveal the answer checklist and mark whether you were genuinely ready.
          </p>
        </div>
        <div className="space-y-2 text-right">
          <Badge variant={progressPercent >= 70 ? "success" : progressPercent >= 40 ? "warning" : "default"}>
            Saved {progressPercent}%
          </Badge>
          <p className="text-xs text-muted-foreground">
            {drills.length} exam prompts mapped
          </p>
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
            <span>Readiness</span>
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

      {!sessionComplete && currentDrill ? (
        <div className="mt-5 rounded-[24px] border border-border bg-card/70 p-5">
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
              Before you reveal it
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Sketch the structure of your answer, key ideas, and any example you would use.
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
                  Answer focus
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
                  Need another round
                </Button>
                <Button
                  onClick={() => void handleRateDrill("ready")}
                  isLoading={isSaving}
                >
                  Ready for next
                  <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Do the planning first, then compare it to the checklist.
              </p>
              <Button onClick={() => setShowChecklist(true)}>
                Reveal checklist
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-5 rounded-[24px] border border-border bg-surface/20 px-5 py-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-success" />
            <p className="text-sm font-semibold text-foreground">
              Exam drill round complete
            </p>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            You worked through {drills.length} exam prompts. Current readiness: {readinessPercent}%.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleRestart}>
              <RotateCcw size={14} />
              Run again
            </Button>
            <Badge variant={readinessPercent >= 70 ? "success" : readinessPercent >= 40 ? "warning" : "danger"}>
              {readinessPercent >= 70 ? "Ready for exam wording" : readinessPercent >= 40 ? "Some gaps remain" : "Needs guided review"}
            </Badge>
          </div>
        </div>
      )}
    </Card>
  );
}

export function TopicPracticeStudio({
  topicId,
  topicLabel,
}: TopicPracticeStudioProps) {
  const { revisionProgress, trackPracticeSetProgress } = useAppData();
  const bundle = useMemo(() => getTopicPracticeBundle(topicId), [topicId]);
  const recallSetId = getPracticeSetId(topicId, "recall");
  const examSetId = getPracticeSetId(topicId, "exam-drill");
  const quizSetId = getPracticeSetId(topicId, "quiz");
  const recallProgress =
    getPracticeSetProgress(revisionProgress, topicId, recallSetId)?.progressPercent ?? 0;
  const examProgress =
    getPracticeSetProgress(revisionProgress, topicId, examSetId)?.progressPercent ?? 0;
  const quizProgress =
    getPracticeSetProgress(revisionProgress, topicId, quizSetId)?.progressPercent ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface/30 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Recall cards
          </p>
          <p className="mt-3 text-3xl font-bold text-foreground">
            {bundle.recallCards.length}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Terms and official curriculum points for active recall.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface/30 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Exam drills
          </p>
          <p className="mt-3 text-3xl font-bold text-foreground">
            {bundle.examDrills.length}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Past-paper style prompts linked to answer focus and mark-scheme cues.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface/30 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Quiz pool
          </p>
          <p className="mt-3 text-3xl font-bold text-foreground">
            {bundle.quizQuestions.length}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Retrieval questions drawn from glossary, subtopics, and exam metadata.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface/30 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Saved practice
          </p>
          <p className="mt-3 text-3xl font-bold text-foreground">
            {Math.round((recallProgress + examProgress + quizProgress) / 3)}%
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Combined saved progress across recall, drills, and quiz work.
          </p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <RecallPanel
          cards={bundle.recallCards}
          progressPercent={recallProgress}
          onComplete={(progressPercent) =>
            trackPracticeSetProgress({
              practiceSetId: recallSetId,
              topicId,
              title: `${topicLabel} recall cycle`,
              progressPercent,
              minutesSpent: Math.max(10, bundle.recallCards.length * 2),
            })
          }
        />

        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-accent" />
            <h3 className="text-sm font-semibold text-foreground">
              Guided resource path
            </h3>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            The PDFs are now part of the learning loop: learn, test, then compare with answer language.
          </p>

          <div className="mt-5 space-y-3">
            {bundle.resourceSteps.map((step) =>
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
                  <p className="mt-2 text-sm text-foreground">
                    No mapped resource yet
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">{step.why}</p>
                </div>
              )
            )}

            <div className="rounded-2xl border border-warning/20 bg-warning/10 px-4 py-4">
              <div className="flex items-center gap-2">
                <Target size={14} className="text-warning" />
                <p className="text-sm font-medium text-foreground">
                  Best order for this topic
                </p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Recall first, then attempt a timed prompt, then compare your wording with question-bank and mark-scheme material.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <ExamDrillPanel
        drills={bundle.examDrills}
        progressPercent={examProgress}
        onComplete={(progressPercent) =>
          trackPracticeSetProgress({
            practiceSetId: examSetId,
            topicId,
            title: `${topicLabel} exam drill`,
            progressPercent,
            minutesSpent: Math.max(12, bundle.examDrills.length * 4),
          })
        }
      />

      <WrittenAnswerChecker topicId={topicId} topicLabel={topicLabel} />

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList size={15} className="text-accent" />
              <h3 className="text-sm font-semibold text-foreground">
                Rapid-fire quiz
              </h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Short retrieval questions for speed, terminology, and quick correction.
            </p>
          </div>
          <Badge variant={quizProgress >= 70 ? "success" : quizProgress >= 40 ? "warning" : "default"}>
            Saved {quizProgress}%
          </Badge>
        </div>

        <QuickQuiz topicId={topicId} />
      </div>
    </div>
  );
}
