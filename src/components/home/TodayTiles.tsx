"use client";

import { CalendarClock, Check, GraduationCap, Newspaper } from "lucide-react";
import Link from "next/link";
import { DeadlineChip } from "@/components/applications/DeadlineChip";
import { useApplications } from "@/components/applications/useApplications";
import { useFlashcards } from "@/components/flashcards/useFlashcards";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { nextDeadline, routeLabel } from "@/lib/applications/model";
import { todayIsoDate } from "@/lib/format";
import type { DailyCheck } from "@/lib/store/collections";

function Tile({
  title,
  icon: Icon,
  children,
  id,
}: {
  title: string;
  icon: typeof Check;
  children: React.ReactNode;
  id: string;
}) {
  return (
    <Card aria-labelledby={id} className="flex flex-col gap-2">
      <h2 id={id} className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
        <Icon aria-hidden className="size-4 text-accent" />
        {title}
      </h2>
      {children}
    </Card>
  );
}

export function CardsDueTile() {
  const fc = useFlashcards();
  return (
    <Tile title="Cards due" icon={GraduationCap} id="tile-cards">
      {fc.status !== "ready" ? (
        <p className="text-sm text-muted">{fc.status === "error" ? `Couldn't load: ${fc.error}` : "Loading…"}</p>
      ) : (
        <>
          <p>
            <span className="num text-3xl font-semibold">{fc.totals.due}</span>{" "}
            <span className="text-sm text-muted">due today</span>
          </p>
          <p className="text-xs text-muted">
            {fc.totals.fresh} not started yet · {fc.totals.mastered} mastered
          </p>
          <div className="mt-auto">
            {fc.totals.due + fc.totals.fresh > 0 ? (
              <Link href="/flashcards/study" className={buttonClasses("primary", "sm")}>
                Start studying
              </Link>
            ) : (
              <p className="text-xs text-muted">All caught up.</p>
            )}
          </div>
        </>
      )}
    </Tile>
  );
}

export function NextDeadlineTile() {
  const { apps, status, error } = useApplications();
  const today = todayIsoDate();
  const next = status === "ready" ? nextDeadline(apps, today) : null;
  return (
    <Tile title="Next deadline" icon={CalendarClock} id="tile-deadline">
      {status !== "ready" ? (
        <p className="text-sm text-muted">{status === "error" ? `Couldn't load: ${error}` : "Loading…"}</p>
      ) : next ? (
        <>
          <p className="font-semibold leading-snug">{next.employer}</p>
          <p className="text-xs text-muted">
            {next.role ? `${next.role} · ` : ""}
            {routeLabel(next.route)}
          </p>
          <DeadlineChip deadline={next.deadline} rolling={next.rolling} today={today} />
          <Link href="/applications/deadlines" className="mt-auto text-xs text-accent hover:underline">
            All deadlines →
          </Link>
        </>
      ) : (
        <>
          <p className="text-sm text-muted">No upcoming deadlines on applications you haven&apos;t submitted.</p>
          <Link href="/applications" className="mt-auto text-xs text-accent hover:underline">
            Add an application →
          </Link>
        </>
      )}
    </Tile>
  );
}

export function CommercialAwarenessTile({
  ticked,
  notesToday,
  ready,
  onToggle,
}: {
  ticked: boolean;
  notesToday: number;
  ready: boolean;
  onToggle: (value: boolean) => void;
}) {
  const done = ticked || notesToday > 0;
  return (
    <Tile title="Commercial awareness" icon={Newspaper} id="tile-ca">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={ticked}
          disabled={!ready}
          onChange={(e) => onToggle(e.target.checked)}
          className="mt-1 size-5 accent-[var(--accent)]"
        />
        <span>
          <span className="block font-medium">Done today?</span>
          <span className="block text-xs text-muted">Read the headlines and thought about what they mean.</span>
        </span>
      </label>
      <p className={`text-sm ${done ? "text-up" : "text-muted"}`} aria-live="polite">
        {done ? (
          <>
            <Check aria-hidden className="inline size-4" />{" "}
            {notesToday > 0 ? `Done - ${notesToday} note${notesToday === 1 ? "" : "s"} written today.` : "Done for today."}
          </>
        ) : (
          "Not yet today."
        )}
      </p>
      <Link href="/news" className="mt-auto text-xs text-accent hover:underline">
        Today&apos;s headlines →
      </Link>
    </Tile>
  );
}

/** Set or clear today's tick in the dailyChecks collection. */
export function setTodayTick(checks: DailyCheck[], today: string, value: boolean): DailyCheck[] {
  const rest = checks.filter((c) => c.date !== today);
  return value ? [...rest, { date: today, commercialAwareness: true }] : rest;
}
