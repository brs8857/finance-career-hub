"use client";

import { ExternalLink, GripVertical, Plus, Users } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { routeLabel, STAGES, type StageId } from "@/lib/applications/model";
import { todayIsoDate } from "@/lib/format";
import type { Application } from "@/lib/store/collections";
import { ApplicationDialog } from "./ApplicationDialog";
import { DeadlineChip } from "./DeadlineChip";
import { useApplications } from "./useApplications";

const DRAG_TYPE = "application/x-fch-id";

function ApplicationCard({
  app,
  today,
  onEdit,
  onMove,
}: {
  app: Application;
  today: string;
  onEdit: () => void;
  onMove: (stage: StageId) => void;
}) {
  const moveId = useId();
  const showCountdown = app.stage === "researching" || app.stage === "applying";
  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(DRAG_TYPE, app.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      aria-label={`${app.employer}${app.role ? `, ${app.role}` : ""}`}
      className="group rounded-md border border-border bg-surface p-3 shadow-sm"
    >
      <div className="flex items-start gap-1">
        <GripVertical aria-hidden className="mt-0.5 size-4 shrink-0 cursor-grab text-muted opacity-50 group-hover:opacity-100" />
        <div className="min-w-0 flex-1">
          <button type="button" onClick={onEdit} className="block w-full text-left">
            <span className="block truncate font-medium hover:underline">{app.employer}</span>
            {app.role ? <span className="block truncate text-xs text-muted">{app.role}</span> : null}
          </button>
          <p className="mt-1 text-xs text-muted">{routeLabel(app.route)}</p>
          {app.deadline ? (
            <div className="mt-1.5">
              <DeadlineChip deadline={app.deadline} rolling={app.rolling} today={today} showCountdown={showCountdown} />
            </div>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
            {app.contacts.length > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Users aria-hidden className="size-3" />
                {app.contacts.length}
                <span className="sr-only">contact{app.contacts.length === 1 ? "" : "s"}</span>
              </span>
            ) : null}
            {app.link ? (
              <a href={app.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline">
                Link <ExternalLink aria-hidden className="size-3" />
                <span className="sr-only">for {app.employer} (opens in a new tab)</span>
              </a>
            ) : null}
          </div>
          {/* Keyboard- and touch-friendly alternative to dragging. */}
          <label htmlFor={moveId} className="sr-only">
            Move {app.employer} to stage
          </label>
          <select
            id={moveId}
            value={app.stage}
            onChange={(e) => onMove(e.target.value as StageId)}
            className="mt-2 w-full rounded border border-border bg-surface-2 px-1.5 py-1 text-xs"
          >
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id === app.stage ? `Stage: ${s.label}` : `Move to ${s.label}`}
              </option>
            ))}
          </select>
        </div>
      </div>
    </article>
  );
}

export function KanbanBoard() {
  const { apps, status, error, saveError, save, remove, move } = useApplications();
  const [dialog, setDialog] = useState<{ mode: "new"; stage?: StageId } | { mode: "edit"; app: Application } | null>(null);
  const [dropTarget, setDropTarget] = useState<StageId | null>(null);
  const today = todayIsoDate();

  if (status === "loading") return <p className="text-sm text-muted">Loading applications…</p>;
  if (status === "error") {
    return (
      <p role="alert" className="text-sm text-down">
        Couldn&apos;t load applications: {error}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {apps.length === 0
            ? "Nothing tracked yet. Add the first firm you're researching."
            : `${apps.length} application${apps.length === 1 ? "" : "s"}. Drag cards between columns, or use the menu on each card.`}
        </p>
        <Button variant="primary" onClick={() => setDialog({ mode: "new" })}>
          <Plus aria-hidden className="size-4" /> Add application
        </Button>
      </div>

      {saveError ? (
        <p role="alert" className="text-sm text-down">
          {saveError}
        </p>
      ) : null}

      {/* `relative` keeps absolutely positioned children (sr-only labels) inside the scroller;
          without it they escape and make the whole page scroll sideways. */}
      <div className="relative -mx-4 overflow-x-auto px-4 pb-2 md:-mx-8 md:px-8">
        <ol className="flex snap-x gap-3" aria-label="Application stages">
          {STAGES.map((stage) => {
            const cards = apps
              .filter((a) => a.stage === stage.id)
              .sort((a, b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999") || a.employer.localeCompare(b.employer));
            return (
              <li
                key={stage.id}
                aria-labelledby={`col-${stage.id}`}
                onDragOver={(e) => {
                  if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
                  e.preventDefault();
                  setDropTarget(stage.id);
                }}
                onDragLeave={() => setDropTarget((t) => (t === stage.id ? null : t))}
                onDrop={(e) => {
                  const id = e.dataTransfer.getData(DRAG_TYPE);
                  setDropTarget(null);
                  if (id) move(id, stage.id);
                }}
                className={`flex w-64 shrink-0 snap-start flex-col rounded-lg border p-2 transition-colors ${
                  dropTarget === stage.id ? "border-accent bg-surface-2" : "border-border bg-bg"
                }`}
              >
                <div className="mb-2 flex items-center justify-between px-1">
                  <h2 id={`col-${stage.id}`} className="text-sm font-semibold">
                    {stage.label}
                  </h2>
                  <span className="num rounded-full bg-surface-2 px-2 text-xs text-muted">{cards.length}</span>
                </div>
                <div className="flex min-h-24 flex-1 flex-col gap-2">
                  {cards.map((app) => (
                    <ApplicationCard
                      key={app.id}
                      app={app}
                      today={today}
                      onEdit={() => setDialog({ mode: "edit", app })}
                      onMove={(s) => move(app.id, s)}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setDialog({ mode: "new", stage: stage.id })}
                    className="rounded-md border border-dashed border-border px-2 py-1.5 text-xs text-muted hover:border-accent/60 hover:text-fg"
                  >
                    + Add to {stage.label}
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <ApplicationDialog open={dialog} onSave={save} onDelete={remove} onClose={() => setDialog(null)} />
    </div>
  );
}
