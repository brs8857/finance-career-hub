"use client";

import { AlertTriangle, Bookmark, BookmarkCheck, ExternalLink, PenLine } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNow } from "@/components/ui/useNow";
import { dayGroupLabel, formatRelative, formatTime } from "@/lib/format";
import { hasNoteContent } from "@/lib/news/search";
import type { Headline, NewsResponse } from "@/lib/news/types";
import { NoteEditorDialog, type NoteTarget } from "./NoteEditorDialog";
import { useNewsNotes } from "./useNewsNotes";

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: NewsResponse };

export function HeadlineFeed() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<NoteTarget | null>(null);
  const notes = useNewsNotes();
  const now = useNow(60_000);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/news", { cache: "no-store" })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
        if (!cancelled) setState({ status: "ready", data: body as NewsResponse });
      })
      .catch((error: Error) => {
        if (!cancelled) setState({ status: "error", message: error.message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const groups = useMemo(() => {
    if (state.status !== "ready") return [];
    const out: Array<{ label: string; items: Headline[] }> = [];
    for (const h of state.data.headlines) {
      if (hidden.has(h.feedId)) continue;
      const label = h.publishedAt ? dayGroupLabel(h.publishedAt, new Date(now)) : "Undated";
      const group = out.at(-1);
      if (group?.label === label) group.items.push(h);
      else out.push({ label, items: [h] });
    }
    return out;
  }, [state, hidden, now]);

  if (state.status === "loading") {
    return (
      <div className="space-y-2" aria-label="Loading headlines">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-md bg-surface" />
        ))}
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <p role="alert" className="text-sm text-down">
        Couldn&apos;t load headlines: {state.message}
      </p>
    );
  }

  const { feeds } = state.data;
  const toggle = (id: string) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Sources</legend>
        <div className="flex flex-wrap gap-2">
          {feeds.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => toggle(f.id)}
              aria-pressed={!hidden.has(f.id)}
              disabled={f.status === "error"}
              title={f.error ?? f.note ?? (f.fetchedAt ? `Updated ${formatRelative(f.fetchedAt, now)}` : undefined)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
                hidden.has(f.id) ? "border-border text-muted" : "border-accent/50 bg-surface-2 text-fg"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {f.status !== "ok" ? <AlertTriangle aria-hidden className="size-3 text-warn-fg" /> : null}
              {f.name}
              <span className="num text-muted">{f.count}</span>
            </button>
          ))}
        </div>
        {feeds.some((f) => f.status !== "ok") ? (
          <p className="mt-2 text-xs text-muted">
            {feeds
              .filter((f) => f.status !== "ok")
              .map((f) => (f.status === "error" ? `${f.name}: unavailable (${f.error})` : `${f.name}: showing last copy`))
              .join(" · ")}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-muted">
          Headlines and links only - articles open on the publisher&apos;s site. Refreshed every 30 minutes.
        </p>
      </fieldset>

      {groups.map((group) => (
        <section key={group.label} aria-labelledby={`day-${group.label}`}>
          <h2 id={`day-${group.label}`} className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
            {group.label}
          </h2>
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
            {group.items.map((h) => {
              const saved = notes.byUrl.get(h.url);
              const written = saved ? hasNoteContent(saved) : false;
              return (
                <li key={h.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <a
                      href={h.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium leading-snug hover:text-accent hover:underline"
                    >
                      {h.title}
                      <ExternalLink aria-hidden className="ml-1 inline size-3 text-muted" />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                    <p className="mt-0.5 text-xs text-muted">
                      {h.source}
                      {h.publishedAt ? (
                        <>
                          {" · "}
                          <time dateTime={h.publishedAt}>{formatTime(h.publishedAt)}</time>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setEditing({ headline: h.title, url: h.url, source: h.source, publishedAt: h.publishedAt })
                    }
                    disabled={notes.status !== "ready"}
                    className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
                      saved ? "text-accent hover:bg-surface-2" : "text-muted hover:bg-surface-2 hover:text-fg"
                    }`}
                    aria-label={`${saved ? (written ? "Edit note on" : "Write note on") : "Save and note"}: ${h.title}`}
                  >
                    {saved ? (
                      written ? (
                        <PenLine aria-hidden className="size-3.5" />
                      ) : (
                        <BookmarkCheck aria-hidden className="size-3.5" />
                      )
                    ) : (
                      <Bookmark aria-hidden className="size-3.5" />
                    )}
                    <span className="hidden sm:inline">{saved ? (written ? "Edit note" : "Saved") : "Save & note"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {notes.saveError ? (
        <p role="alert" className="text-sm text-down">
          {notes.saveError}
        </p>
      ) : null}

      <NoteEditorDialog
        target={editing}
        existing={editing ? notes.byUrl.get(editing.url) : undefined}
        onSave={notes.save}
        onDelete={notes.remove}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}
