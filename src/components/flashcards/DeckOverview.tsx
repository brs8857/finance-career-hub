"use client";

import { GraduationCap, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { DECKS, deckName, type DeckId } from "@/content/decks";
import { INTERVAL_DAYS } from "@/lib/srs/leitner";
import { useFlashcards } from "./useFlashcards";

const inputClass = "mt-1 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm";

function MasteryBar({ mastered, total }: { mastered: number; total: number }) {
  const pct = total ? Math.round((mastered / total) * 100) : 0;
  return (
    <div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={mastered}
        aria-label="Cards mastered"
        className="h-1.5 overflow-hidden rounded-full bg-surface-2"
      >
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted">
        {mastered} of {total} mastered (top box)
      </p>
    </div>
  );
}

export function DeckOverview() {
  const fc = useFlashcards();
  const [deckId, setDeckId] = useState<DeckId>("my-cards");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const uid = useId();

  if (fc.status === "loading") return <p className="text-sm text-muted">Loading your decks…</p>;
  if (fc.status === "error") {
    return (
      <p role="alert" className="text-sm text-down">
        Couldn&apos;t load flashcards: {fc.error}
      </p>
    );
  }

  const studyable = fc.totals.due + fc.totals.fresh;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const f = front.trim();
    const b = back.trim();
    if (!f || !b) return setMessage("Add both a question and an answer.");
    if (editing) {
      fc.editCard(editing, { front: f, back: b, deckId });
      setMessage("Card updated.");
    } else {
      fc.addCard(deckId, f, b);
      setMessage(`Added to ${deckName(deckId)}.`);
    }
    setEditing(null);
    setFront("");
    setBack("");
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3">
        <p className="text-sm">
          <strong className="num text-lg">{fc.totals.due}</strong> <span className="text-muted">due today</span>
          <span className="mx-2 text-muted">·</span>
          <strong className="num text-lg">{fc.totals.fresh}</strong> <span className="text-muted">not started</span>
        </p>
        {studyable > 0 ? (
          <Link href="/flashcards/study" className={buttonClasses("primary")}>
            <GraduationCap aria-hidden className="size-4" /> Study all decks
          </Link>
        ) : (
          <p className="text-sm text-muted">All caught up - come back tomorrow.</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {DECKS.map((deck) => {
          const s = fc.stats[deck.id];
          return (
            <Card key={deck.id} as="article" aria-labelledby={`deck-${deck.id}`} className="flex flex-col gap-3">
              <div>
                <h2 id={`deck-${deck.id}`} className="font-semibold">
                  {deck.name}
                </h2>
                <p className="text-sm text-muted">{deck.description}</p>
              </div>
              <p className="text-sm">
                <span className="num font-semibold">{s.due}</span> due · <span className="num font-semibold">{s.fresh}</span> new ·{" "}
                <span className="num">{s.total}</span> total
              </p>
              <MasteryBar mastered={s.mastered} total={s.total} />
              <div className="mt-auto">
                {s.due + s.fresh > 0 ? (
                  <Link href={`/flashcards/study?deck=${deck.id}`} className={buttonClasses("secondary", "sm")}>
                    Study {deck.name}
                  </Link>
                ) : (
                  <p className="text-xs text-muted">{s.total === 0 ? "No cards yet - add one below." : "Nothing due."}</p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader
          title={editing ? "Edit your card" : "Add your own card"}
          description="Writing a card in your own words is half the learning. Keep the question specific and the answer short."
        />
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label htmlFor={`${uid}-deck`} className="text-sm font-medium">
              Deck
            </label>
            <select id={`${uid}-deck`} value={deckId} onChange={(e) => setDeckId(e.target.value as DeckId)} className={inputClass}>
              {DECKS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${uid}-front`} className="text-sm font-medium">
              Question
            </label>
            <textarea id={`${uid}-front`} rows={2} maxLength={1000} value={front} onChange={(e) => setFront(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor={`${uid}-back`} className="text-sm font-medium">
              Answer
            </label>
            <textarea id={`${uid}-back`} rows={4} maxLength={4000} value={back} onChange={(e) => setBack(e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" variant="primary">
              {editing ? "Save changes" : "Add card"}
            </Button>
            {editing ? (
              <Button
                onClick={() => {
                  setEditing(null);
                  setFront("");
                  setBack("");
                }}
              >
                Cancel
              </Button>
            ) : null}
            <p aria-live="polite" className="text-xs text-muted">
              {fc.saveError ?? message}
            </p>
          </div>
        </form>

        {fc.custom.length > 0 ? (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-semibold">Your cards ({fc.custom.length})</h3>
            <ul className="divide-y divide-border rounded-md border border-border">
              {fc.custom.map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-3 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">{c.front}</p>
                    <p className="text-xs text-muted">{deckName(c.deckId)}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(c.id);
                        setDeckId(c.deckId);
                        setFront(c.front);
                        setBack(c.back);
                        setMessage(null);
                      }}
                      className="rounded p-1.5 text-muted hover:bg-surface-2 hover:text-fg"
                      aria-label={`Edit card: ${c.front}`}
                    >
                      <Pencil aria-hidden className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Delete this card and its progress?")) fc.deleteCard(c.id);
                      }}
                      className="rounded p-1.5 text-muted hover:bg-surface-2 hover:text-down"
                      aria-label={`Delete card: ${c.front}`}
                    >
                      <Trash2 aria-hidden className="size-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>

      <details className="text-sm text-muted">
        <summary className="cursor-pointer hover:text-fg">How the scheduling works</summary>
        <p className="mt-2">
          Leitner boxes: every card starts in box 1. Get it right and it moves up a box; get it wrong and it goes back to box
          1. Box 1 comes back after {INTERVAL_DAYS[0]} day, then {INTERVAL_DAYS.slice(1).join(", ")} days for boxes 2-5.
          Up to 15 new cards are introduced per session so reviews stay manageable.
        </p>
      </details>
    </div>
  );
}
