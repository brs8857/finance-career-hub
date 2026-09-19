"use client";

import { AlertTriangle, Clock, FlaskConical } from "lucide-react";
import { formatDateTime, formatRelative } from "@/lib/format";
import { SOURCE_LABELS, type Provenance } from "@/lib/markets/types";
import { useNow } from "./useNow";

/** Amber "SAMPLE DATA" pill. Shown wherever numbers are not real. */
export function SampleBadge({ title }: { title?: string }) {
  return (
    <span
      title={title}
      className="inline-flex items-center gap-1 rounded-full bg-warn-bg px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-warn-fg"
    >
      <FlaskConical aria-hidden className="size-3" />
      Sample data
    </span>
  );
}

export function StaleBadge({ title }: { title?: string }) {
  return (
    <span
      title={title}
      className="inline-flex items-center gap-1 rounded-full bg-warn-bg px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-warn-fg"
    >
      <AlertTriangle aria-hidden className="size-3" />
      Last known
    </span>
  );
}

/**
 * Source + last-updated line. Everything shown comes from the payload's
 * provenance fields - this component never guesses.
 */
export function DataStatus({ provenance, className = "" }: { provenance: Provenance; className?: string }) {
  const now = useNow();
  const { source, fetchedAt, isSample, stale, note } = provenance;

  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted ${className}`}>
      {isSample ? <SampleBadge title={note} /> : null}
      {stale ? <StaleBadge title={note} /> : null}
      {!isSample ? (
        <span className="inline-flex items-center gap-1">
          <Clock aria-hidden className="size-3" />
          <span>
            {SOURCE_LABELS[source]} · updated{" "}
            <time dateTime={fetchedAt} title={formatDateTime(fetchedAt)}>
              {formatRelative(fetchedAt, now)}
            </time>
          </span>
        </span>
      ) : null}
      {note ? <span className="basis-full">{note}</span> : null}
    </div>
  );
}
