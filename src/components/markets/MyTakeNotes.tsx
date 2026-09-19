"use client";

import { Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Delta } from "@/components/ui/Delta";
import { formatDate, formatPrice, todayIsoDate } from "@/lib/format";
import { SOURCE_LABELS, type DataSource, type Instrument, type QuoteResult } from "@/lib/markets/types";
import { newId, type InstrumentNote } from "@/lib/store/collections";
import { useCollection } from "@/lib/store/useCollection";

/**
 * "My take": the user's own explanation of why an instrument moved, saved
 * with the date. Real (non-sample) quotes are captured alongside the note so
 * the numbers it explains are there when revising later.
 */
export function MyTakeNotes({
  instrument,
  result,
  currency,
}: {
  instrument: Instrument;
  result: QuoteResult | undefined;
  currency: string | null;
}) {
  const { data, status, error, saveError, update } = useCollection("instrumentNotes");
  const [text, setText] = useState("");
  const [date, setDate] = useState(() => todayIsoDate());
  const textId = useId();
  const dateId = useId();

  const notes = (data ?? [])
    .filter((n) => n.symbol === instrument.symbol)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  function save(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    const quote = result?.quote;
    const note: InstrumentNote = {
      id: newId(),
      symbol: instrument.symbol,
      date,
      text: trimmed,
      createdAt: new Date().toISOString(),
      context:
        quote && result && !result.isSample
          ? {
              price: quote.price,
              change: quote.change,
              changePct: quote.changePct,
              asOf: quote.asOf,
              source: result.source,
            }
          : undefined,
    };
    update((all) => [...all, note]);
    setText("");
  }

  function remove(note: InstrumentNote) {
    if (!window.confirm(`Delete your note from ${formatDate(note.date)}? This can't be undone.`)) return;
    update((all) => all.filter((n) => n.id !== note.id));
  }

  return (
    <section aria-labelledby={`${textId}-heading`}>
      <h3 id={`${textId}-heading`} className="text-sm font-semibold">
        My take
      </h3>
      <p className="mt-0.5 text-xs text-muted">
        Why do you think it moved? Link it to news, data releases or theory. Good notes become interview answers.
      </p>

      <form onSubmit={save} className="mt-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={dateId} className="text-xs text-muted">
            Date
          </label>
          <input
            id={dateId}
            type="date"
            value={date}
            max={todayIsoDate()}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-border bg-surface px-2 py-1 text-sm"
            required
          />
        </div>
        <label htmlFor={textId} className="sr-only">
          Your note
        </label>
        <textarea
          id={textId}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={4000}
          placeholder="e.g. Fell after hotter-than-expected CPI raised expectations of higher Bank Rate…"
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm placeholder:text-muted"
        />
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted">
            {result && !result.isSample
              ? "Today's move is saved with the note."
              : "Sample data is showing, so no prices will be saved with this note."}
          </p>
          <Button type="submit" variant="primary" disabled={!text.trim() || status !== "ready"}>
            Save note
          </Button>
        </div>
        {saveError ? <p role="alert" className="text-xs text-down">{saveError}</p> : null}
      </form>

      <div className="mt-4">
        {status === "loading" ? <p className="text-xs text-muted">Loading notes…</p> : null}
        {status === "error" ? <p role="alert" className="text-xs text-down">Couldn&apos;t load notes: {error}</p> : null}
        {status === "ready" && notes.length === 0 ? (
          <p className="text-xs text-muted">No notes on {instrument.name} yet.</p>
        ) : null}
        <ul className="space-y-2">
          {notes.map((note) => (
            <li key={note.id} className="rounded-md border border-border bg-surface-2 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                  <time dateTime={note.date} className="font-medium text-fg">
                    {formatDate(note.date)}
                  </time>
                  {note.context ? (
                    <span className="inline-flex items-center gap-1">
                      {formatPrice(note.context.price, instrument.kind, currency)}
                      <Delta
                        change={note.context.change}
                        changePct={note.context.changePct}
                        kind={instrument.kind}
                        currency={currency}
                        showAbsolute={instrument.kind === "yield"}
                      />
                      <span>· {SOURCE_LABELS[note.context.source as DataSource] ?? note.context.source}</span>
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => remove(note)}
                  className="rounded p-1 text-muted hover:bg-surface hover:text-down"
                  aria-label={`Delete note from ${formatDate(note.date)}`}
                >
                  <Trash2 aria-hidden className="size-3.5" />
                </button>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm">{note.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
