"use client";

import { Check, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, buttonClasses } from "@/components/ui/Button";
import { deckName, type DeckId } from "@/content/decks";
import { buildQueue } from "@/lib/srs/leitner";
import { useFlashcards } from "./useFlashcards";

interface Session {
  queue: string[];
  /** Cards missed this session, shown once more at the end (doesn't change scheduling). */
  retry: string[];
  index: number;
  inRetry: boolean;
  correct: number;
  wrong: number;
}

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

export function StudySession({ deckId }: { deckId: DeckId | null }) {
  const fc = useFlashcards();
  const [session, setSession] = useState<Session | null>(null);
  const [revealed, setRevealed] = useState(false);
  const revealButton = useRef<HTMLButtonElement>(null);

  // Build the queue once, as soon as saved progress has loaded.
  if (session === null && fc.status === "ready") {
    const ids = fc.cards.filter((c) => !deckId || c.deckId === deckId).map((c) => c.id);
    setSession({ queue: buildQueue(ids, fc.progress, fc.today), retry: [], index: 0, inRetry: false, correct: 0, wrong: 0 });
  }

  const list = session ? (session.inRetry ? session.retry : session.queue) : [];
  const currentId = session ? list[session.index] : undefined;
  const card = currentId ? fc.byId.get(currentId) : undefined;
  const finished = session !== null && !card;

  const grade = useCallback(
    (correct: boolean) => {
      if (!session || !currentId || !revealed) return;
      if (!session.inRetry) fc.answer(currentId, correct);
      setSession((s) => {
        if (!s) return s;
        const next: Session = {
          ...s,
          index: s.index + 1,
          correct: s.correct + (!s.inRetry && correct ? 1 : 0),
          wrong: s.wrong + (!s.inRetry && !correct ? 1 : 0),
          retry: !s.inRetry && !correct ? [...s.retry, currentId] : s.retry,
        };
        // End of the main pass: switch to practising missed cards once.
        if (!next.inRetry && next.index >= next.queue.length && next.retry.length > 0) {
          return { ...next, inRetry: true, index: 0 };
        }
        return next;
      });
      setRevealed(false);
    },
    [session, currentId, revealed, fc],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (!revealed && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed && (e.key === "1" || e.key === "ArrowLeft")) {
        e.preventDefault();
        grade(false);
      } else if (revealed && (e.key === "2" || e.key === "ArrowRight")) {
        e.preventDefault();
        grade(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, grade]);

  // Keep keyboard focus on the main action as cards change.
  useEffect(() => {
    if (!revealed) revealButton.current?.focus();
  }, [revealed, currentId]);

  if (fc.status === "loading" || session === null) return <p className="text-sm text-muted">Loading cards…</p>;
  if (fc.status === "error") {
    return (
      <p role="alert" className="text-sm text-down">
        Couldn&apos;t load flashcards: {fc.error}
      </p>
    );
  }

  const title = deckId ? deckName(deckId) : "All decks";

  if (session.queue.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface p-8 text-center">
        <p className="font-medium">Nothing due in {title}.</p>
        <p className="mt-1 text-sm text-muted">Spaced repetition works best a little every day. Come back tomorrow.</p>
        <Link href="/flashcards" className={`${buttonClasses("secondary")} mt-4`}>
          Back to decks
        </Link>
      </div>
    );
  }

  if (finished) {
    const total = session.correct + session.wrong;
    return (
      <div className="rounded-lg border border-border bg-surface p-8 text-center" role="status">
        <p className="text-lg font-semibold">Session complete</p>
        <p className="mt-2 text-sm text-muted">
          <span className="num text-fg">{session.correct}</span> of <span className="num text-fg">{total}</span> right first time
          {session.retry.length > 0 ? `, and you practised ${session.retry.length} again.` : "."}
        </p>
        <p className="mt-1 text-xs text-muted">Missed cards come back tomorrow; the ones you knew are spaced further out.</p>
        <Link href="/flashcards" className={`${buttonClasses("primary")} mt-5`}>
          Back to decks
        </Link>
      </div>
    );
  }

  const position = session.index + 1;
  const length = list.length;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          {title}
          {card?.topic ? ` · ${card.topic}` : ""}
          {session.inRetry ? " · practising missed cards" : ""}
        </span>
        <span className="num" aria-live="polite">
          Card {position} of {length}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Session progress"
        aria-valuemin={0}
        aria-valuemax={length}
        aria-valuenow={session.index}
        className="h-1 overflow-hidden rounded-full bg-surface-2"
      >
        <div className="h-full bg-accent transition-all" style={{ width: `${(session.index / length) * 100}%` }} />
      </div>

      <article className="rounded-xl border border-border bg-surface p-6 shadow-sm" aria-labelledby="card-front">
        <h2 id="card-front" className="text-lg font-semibold leading-snug">
          {card?.front}
        </h2>
        {revealed ? (
          <div className="mt-5 border-t border-border pt-5">
            <p className="sr-only">Answer:</p>
            <p className="whitespace-pre-wrap leading-relaxed">{card?.back}</p>
          </div>
        ) : null}
      </article>

      {!revealed ? (
        <Button ref={revealButton} variant="primary" className="w-full py-2.5" onClick={() => setRevealed(true)}>
          Show answer <kbd className="ml-2 rounded bg-black/20 px-1.5 text-xs">Space</kbd>
        </Button>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Button className="py-2.5" onClick={() => grade(false)}>
            {session.inRetry ? <RotateCcw aria-hidden className="size-4" /> : <X aria-hidden className="size-4" />}
            Not yet <kbd className="ml-1 rounded bg-surface-2 px-1.5 text-xs">1</kbd>
          </Button>
          <Button variant="primary" className="py-2.5" onClick={() => grade(true)}>
            <Check aria-hidden className="size-4" /> Got it <kbd className="ml-1 rounded bg-black/20 px-1.5 text-xs">2</kbd>
          </Button>
        </div>
      )}
      {fc.saveError ? (
        <p role="alert" className="text-sm text-down">
          {fc.saveError}
        </p>
      ) : null}
      <p className="text-center text-xs text-muted">Be honest with yourself - marking a card right too early just means you see it less.</p>
    </div>
  );
}
