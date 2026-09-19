"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { openDeadlines, routeLabel, stageLabel, urgencyOf, type Urgency } from "@/lib/applications/model";
import { todayIsoDate } from "@/lib/format";
import type { Application } from "@/lib/store/collections";
import { ApplicationDialog } from "./ApplicationDialog";
import { DeadlineChip } from "./DeadlineChip";
import { useApplications } from "./useApplications";

const GROUPS: Array<{ id: Urgency; title: string; description: string }> = [
  { id: "overdue", title: "Overdue", description: "Deadline passed but not marked as applied. Update the stage, or check if it's still open." },
  { id: "urgent", title: "Next 7 days", description: "" },
  { id: "soon", title: "Next 30 days", description: "" },
  { id: "later", title: "Later", description: "" },
];

/** Every open (not yet submitted) application with a deadline, soonest first. */
export function DeadlineList() {
  const { apps, status, error, save, remove } = useApplications();
  const [editing, setEditing] = useState<Application | null>(null);
  const today = todayIsoDate();

  if (status === "loading") return <p className="text-sm text-muted">Loading deadlines…</p>;
  if (status === "error") {
    return (
      <p role="alert" className="text-sm text-down">
        Couldn&apos;t load applications: {error}
      </p>
    );
  }

  const open = openDeadlines(apps, today);
  const noDeadline = apps.filter((a) => !a.deadline && (a.stage === "researching" || a.stage === "applying"));

  if (open.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface p-8 text-center">
        <p className="font-medium">No upcoming deadlines.</p>
        <p className="mt-1 text-sm text-muted">
          Add deadlines to applications you&apos;re researching or writing. Check each employer&apos;s own site - dates
          change every cycle and many schemes close early.
        </p>
        <Link href="/applications" className={`${buttonClasses("primary")} mt-4`}>
          Go to the board
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {GROUPS.map((group) => {
        const items = open.filter((a) => urgencyOf(a.days) === group.id);
        if (items.length === 0) return null;
        return (
          <section key={group.id} aria-labelledby={`dl-${group.id}`}>
            <h2 id={`dl-${group.id}`} className="text-sm font-semibold uppercase tracking-wide text-muted">
              {group.title} <span className="num">({items.length})</span>
            </h2>
            {group.description ? <p className="mt-0.5 text-xs text-muted">{group.description}</p> : null}
            <ul className="mt-2 divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
              {items.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <button type="button" onClick={() => setEditing(a)} className="text-left font-medium hover:underline">
                      {a.employer}
                      {a.role ? <span className="font-normal text-muted"> · {a.role}</span> : null}
                    </button>
                    <p className="text-xs text-muted">
                      {routeLabel(a.route)} · {stageLabel(a.stage)}
                    </p>
                  </div>
                  <DeadlineChip deadline={a.deadline} rolling={a.rolling} today={today} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {noDeadline.length > 0 ? (
        <p className="text-xs text-muted">
          {noDeadline.length} application{noDeadline.length === 1 ? " has" : "s have"} no deadline set yet:{" "}
          {noDeadline.map((a) => a.employer).join(", ")}.
        </p>
      ) : null}

      <p className="text-xs text-muted">
        Countdowns use UK dates. Check the exact closing time on the employer&apos;s site - many close at midnight or
        earlier, and rolling schemes can close as soon as they fill.
      </p>

      <ApplicationDialog open={editing ? { mode: "edit", app: editing } : null} onSave={save} onDelete={remove} onClose={() => setEditing(null)} />
    </div>
  );
}
