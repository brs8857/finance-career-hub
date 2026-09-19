"use client";

import { ExternalLink, PenLine, Search } from "lucide-react";
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { Button, buttonClasses } from "@/components/ui/Button";
import { formatDate } from "@/lib/format";
import { hasNoteContent, searchNotes, tagCounts } from "@/lib/news/search";
import { NoteEditorDialog, type NoteTarget } from "./NoteEditorDialog";
import { useNewsNotes } from "./useNewsNotes";

const PARTS = [
  ["whatHappened", "What happened"],
  ["whyItMatters", "Why it matters"],
  ["whatNext", "What might happen next"],
] as const;

/** Searchable archive of saved stories and three-part notes, for revision. */
export function NotesArchive() {
  const { notes, status, error, saveError, save, remove, byUrl } = useNewsNotes();
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [editing, setEditing] = useState<NoteTarget | null>(null);
  const searchId = useId();

  const results = useMemo(() => searchNotes(notes, query, tag), [notes, query, tag]);
  const tags = useMemo(() => tagCounts(notes), [notes]);
  const unwritten = notes.filter((n) => !hasNoteContent(n)).length;

  if (status === "loading") return <p className="text-sm text-muted">Loading your notes…</p>;
  if (status === "error") {
    return (
      <p role="alert" className="text-sm text-down">
        Couldn&apos;t load notes: {error}
      </p>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface p-8 text-center">
        <p className="font-medium">No saved stories yet.</p>
        <p className="mt-1 text-sm text-muted">
          Pick a headline you&apos;d be happy to discuss in an interview and write a three-part note on it.
        </p>
        <Link href="/news" className={`${buttonClasses("primary")} mt-4`}>
          Browse today&apos;s headlines
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <label htmlFor={searchId} className="sr-only">
            Search your notes
          </label>
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search headlines, notes and tags…"
            className="w-full rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm placeholder:text-muted"
          />
        </div>
        <p className="text-xs text-muted" aria-live="polite">
          {results.length} of {notes.length} saved {notes.length === 1 ? "story" : "stories"}
          {unwritten > 0 ? ` · ${unwritten} still need a note` : ""}
        </p>
      </div>

      {tags.length > 0 ? (
        <div role="group" aria-label="Filter by tag" className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTag(null)}
            aria-pressed={tag === null}
            className={`rounded-full border px-3 py-1 text-xs ${tag === null ? "border-accent/50 bg-surface-2" : "border-border text-muted"}`}
          >
            All
          </button>
          {tags.map(({ tag: t, count }) => (
            <button
              key={t}
              type="button"
              onClick={() => setTag(tag === t ? null : t)}
              aria-pressed={tag === t}
              className={`rounded-full border px-3 py-1 text-xs ${tag === t ? "border-accent/50 bg-surface-2" : "border-border text-muted"}`}
            >
              #{t} <span className="num">{count}</span>
            </button>
          ))}
        </div>
      ) : null}

      {saveError ? (
        <p role="alert" className="text-sm text-down">
          {saveError}
        </p>
      ) : null}

      {results.length === 0 ? (
        <p className="text-sm text-muted">Nothing matches that search.</p>
      ) : (
        <ul className="space-y-4">
          {results.map((note) => (
            <li key={note.id}>
              <article className="rounded-lg border border-border bg-surface p-4" aria-labelledby={`note-${note.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 id={`note-${note.id}`} className="font-semibold leading-snug">
                      <a href={note.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent hover:underline">
                        {note.headline}
                        <ExternalLink aria-hidden className="ml-1 inline size-3 text-muted" />
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                    </h2>
                    <p className="mt-0.5 text-xs text-muted">
                      {note.source}
                      {note.publishedAt ? ` · published ${formatDate(note.publishedAt)}` : ""} · saved {formatDate(note.savedAt)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setEditing({ headline: note.headline, url: note.url, source: note.source, publishedAt: note.publishedAt })
                    }
                    aria-label={`Edit note: ${note.headline}`}
                  >
                    <PenLine aria-hidden className="size-3.5" /> Edit
                  </Button>
                </div>

                {hasNoteContent(note) ? (
                  <dl className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                    {PARTS.map(([key, label]) => (
                      <div key={key}>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
                        <dd className="mt-0.5 whitespace-pre-wrap">{note[key] || <span className="text-muted">—</span>}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="mt-3 text-sm text-muted">Saved but not written up yet.</p>
                )}

                {note.tags.length > 0 ? (
                  <p className="mt-3 flex flex-wrap gap-1.5">
                    {note.tags.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTag(t)}
                        className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted hover:text-fg"
                      >
                        #{t}
                      </button>
                    ))}
                  </p>
                ) : null}
              </article>
            </li>
          ))}
        </ul>
      )}

      <NoteEditorDialog
        target={editing}
        existing={editing ? byUrl.get(editing.url) : undefined}
        onSave={save}
        onDelete={remove}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}
