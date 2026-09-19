"use client";

import { ExternalLink, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/format";
import { parseTags } from "@/lib/news/search";
import { newId, type NewsNote } from "@/lib/store/collections";

export interface NoteTarget {
  headline: string;
  url: string;
  source: string;
  publishedAt: string | null;
}

const PROMPTS = [
  {
    key: "whatHappened",
    label: "What happened",
    hint: "The facts, in one or two sentences. Who, what, how much.",
  },
  {
    key: "whyItMatters",
    label: "Why it matters",
    hint: "Who wins, who loses? Link it to a concept: rates, margins, demand, regulation, competition.",
  },
  {
    key: "whatNext",
    label: "What might happen next",
    hint: "What would you watch for? A data release, a decision, a knock-on effect for another sector.",
  },
] as const;

type Fields = Pick<NewsNote, "whatHappened" | "whyItMatters" | "whatNext">;

/** Write or edit the three-part note for a headline. */
export function NoteEditorDialog({
  target,
  existing,
  onSave,
  onDelete,
  onClose,
}: {
  target: NoteTarget | null;
  existing: NewsNote | undefined;
  onSave: (note: NewsNote) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const baseId = useId();
  const [fields, setFields] = useState<Fields>({ whatHappened: "", whyItMatters: "", whatNext: "" });
  const [tags, setTags] = useState("");

  // Load the note being edited whenever the dialog opens for a new headline.
  const targetKey = target?.url ?? null;
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  if (targetKey !== loadedFor) {
    setLoadedFor(targetKey);
    setFields({
      whatHappened: existing?.whatHappened ?? "",
      whyItMatters: existing?.whyItMatters ?? "",
      whatNext: existing?.whatNext ?? "",
    });
    setTags(existing?.tags.join(", ") ?? "");
  }

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (target && !dialog.open) dialog.showModal();
    if (!target && dialog.open) dialog.close();
  }, [target]);

  function save(event: React.FormEvent) {
    event.preventDefault();
    if (!target) return;
    const now = new Date().toISOString();
    onSave({
      id: existing?.id ?? newId(),
      headline: target.headline,
      url: target.url,
      source: target.source,
      publishedAt: target.publishedAt,
      savedAt: existing?.savedAt ?? now,
      updatedAt: now,
      whatHappened: fields.whatHappened.trim(),
      whyItMatters: fields.whyItMatters.trim(),
      whatNext: fields.whatNext.trim(),
      tags: parseTags(tags),
    });
    ref.current?.close();
  }

  function remove() {
    if (!existing) return;
    if (!window.confirm("Delete this saved story and your note? This can't be undone.")) return;
    onDelete(existing.id);
    ref.current?.close();
  }

  const titleId = `${baseId}-title`;

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto w-[min(44rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] rounded-xl border border-border bg-surface p-0 text-fg shadow-xl"
    >
      {target ? (
        <form onSubmit={save} className="space-y-4 p-4 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">{existing ? "Edit note" : "Save story"}</p>
              <h2 id={titleId} className="mt-1 text-lg font-semibold leading-snug">
                {target.headline}
              </h2>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted">
                <span>{target.source}</span>
                {target.publishedAt ? <span>· {formatDateTime(target.publishedAt)}</span> : null}
                <a
                  href={target.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-accent hover:underline"
                >
                  Read the article <ExternalLink aria-hidden className="size-3" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </p>
            </div>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="rounded-md p-2 text-muted hover:bg-surface-2 hover:text-fg"
              aria-label="Close without saving"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>

          <p className="text-xs text-muted">
            Write it in your own words - that&apos;s what makes it stick, and what you&apos;ll say in an interview. You can
            save now and come back to it.
          </p>

          {PROMPTS.map(({ key, label, hint }) => (
            <div key={key}>
              <label htmlFor={`${baseId}-${key}`} className="block text-sm font-medium">
                {label}
              </label>
              <p id={`${baseId}-${key}-hint`} className="text-xs text-muted">
                {hint}
              </p>
              <textarea
                id={`${baseId}-${key}`}
                aria-describedby={`${baseId}-${key}-hint`}
                rows={3}
                maxLength={4000}
                value={fields[key]}
                onChange={(e) => setFields((f) => ({ ...f, [key]: e.target.value }))}
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
              />
            </div>
          ))}

          <div>
            <label htmlFor={`${baseId}-tags`} className="block text-sm font-medium">
              Tags
            </label>
            <input
              id={`${baseId}-tags`}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. rates, banks, uk"
              aria-describedby={`${baseId}-tags-hint`}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm placeholder:text-muted"
            />
            <p id={`${baseId}-tags-hint`} className="mt-1 text-xs text-muted">
              Comma-separated. Useful for revising a theme before an interview (e.g. everything tagged
              &quot;banks&quot;).
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
            {existing ? (
              <Button variant="danger" onClick={remove}>
                Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button onClick={() => ref.current?.close()}>Cancel</Button>
              <Button type="submit" variant="primary">
                {existing ? "Save changes" : "Save story"}
              </Button>
            </div>
          </div>
        </form>
      ) : null}
    </dialog>
  );
}
