"use client";

import { Flame, Pencil, Trophy } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatDate } from "@/lib/format";
import type { Goals, WeekProgress } from "@/lib/goals";

function GoalBar({ label, value, goal, hint }: { label: string; value: number; goal: number; hint: string }) {
  const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 100;
  const met = value >= goal;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">{label}</span>
        <span className="num text-muted">
          <span className={met ? "font-semibold text-up" : "text-fg"}>{value}</span> / {goal}
          {met ? <span className="sr-only"> - goal met</span> : null}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-valuenow={Math.min(value, goal)}
        className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2"
      >
        <div className={`h-full rounded-full ${met ? "bg-up" : "bg-accent"}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-0.5 text-xs text-muted">{hint}</p>
    </div>
  );
}

export function WeeklyGoals({
  goals,
  progress,
  dailyStreak,
  weeklyStreak,
  onSaveGoals,
  ready,
}: {
  goals: Goals;
  progress: WeekProgress;
  dailyStreak: number;
  weeklyStreak: number;
  onSaveGoals: (goals: Goals) => void;
  ready: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(goals);
  const uid = useId();

  const fields: Array<{ key: keyof Goals; label: string; max: number }> = [
    { key: "notesPerWeek", label: "Notes per week", max: 100 },
    { key: "cardsPerWeek", label: "Cards per week", max: 2000 },
    { key: "applicationsPerWeek", label: "Applications progressed per week", max: 100 },
  ];

  return (
    <Card aria-labelledby="goals-heading">
      <CardHeader
        title="This week"
        id="goals-heading"
        description={`${formatDate(progress.start)} – ${formatDate(progress.end)}`}
        action={
          !editing ? (
            <Button
              size="sm"
              variant="ghost"
              disabled={!ready}
              onClick={() => {
                setDraft(goals);
                setEditing(true);
              }}
            >
              <Pencil aria-hidden className="size-3.5" /> Edit goals
            </Button>
          ) : null
        }
      />

      {editing ? (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            onSaveGoals(draft);
            setEditing(false);
          }}
        >
          {fields.map((f) => (
            <div key={f.key} className="flex items-center justify-between gap-3">
              <label htmlFor={`${uid}-${f.key}`} className="text-sm">
                {f.label}
              </label>
              <input
                id={`${uid}-${f.key}`}
                type="number"
                min={0}
                max={f.max}
                step={1}
                value={draft[f.key]}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, [f.key]: Math.max(0, Math.min(f.max, Math.round(Number(e.target.value) || 0))) }))
                }
                className="num w-24 rounded-md border border-border bg-surface px-2 py-1 text-right text-sm"
              />
            </div>
          ))}
          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="sm">
              Save goals
            </Button>
            <Button size="sm" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <GoalBar label="Notes written" value={progress.notes} goal={goals.notesPerWeek} hint="News notes and 'My take' notes." />
          <GoalBar label="Flashcards reviewed" value={progress.cards} goal={goals.cardsPerWeek} hint="Every answer counts, right or wrong." />
          <GoalBar
            label="Applications progressed"
            value={progress.applications}
            goal={goals.applicationsPerWeek}
            hint="Moved forward a stage on the board."
          />
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
        <p className="flex items-center gap-2">
          <Flame aria-hidden className="size-5 text-accent" />
          <span>
            <span className="num block text-xl font-semibold">{dailyStreak}</span>
            <span className="text-xs text-muted">day streak</span>
          </span>
        </p>
        <p className="flex items-center gap-2">
          <Trophy aria-hidden className="size-5 text-accent" />
          <span>
            <span className="num block text-xl font-semibold">{weeklyStreak}</span>
            <span className="text-xs text-muted">{weeklyStreak === 1 ? "week" : "weeks"} in a row, all goals met</span>
          </span>
        </p>
      </div>
      <p className="mt-2 text-xs text-muted">A streak day is any day you review a card, write a note or tick commercial awareness.</p>
    </Card>
  );
}
