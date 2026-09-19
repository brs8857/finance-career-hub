"use client";

import { useMemo } from "react";
import { useNow } from "@/components/ui/useNow";
import { todayIsoDate } from "@/lib/format";
import {
  activeDays,
  commercialAwarenessToday,
  dailyStreak,
  DEFAULT_GOALS,
  weekProgress,
  weeklyStreak,
  type ActivityInputs,
} from "@/lib/goals";
import { useCollection } from "@/lib/store/useCollection";
import { MarketSnapshot } from "./MarketSnapshot";
import { CardsDueTile, CommercialAwarenessTile, NextDeadlineTile, setTodayTick } from "./TodayTiles";
import { WeeklyGoals } from "./WeeklyGoals";

export function HomeDashboard() {
  const newsNotes = useCollection("newsNotes");
  const instrumentNotes = useCollection("instrumentNotes");
  const reviewLog = useCollection("reviewLog");
  const applications = useCollection("applications");
  const dailyChecks = useCollection("dailyChecks");
  const goals = useCollection("goals");

  // Re-evaluate "today" every minute so the page rolls over at midnight.
  const now = useNow(60_000);
  const today = todayIsoDate(new Date(now));

  const all = [newsNotes, instrumentNotes, reviewLog, applications, dailyChecks, goals];
  const ready = all.every((c) => c.status === "ready");
  const firstError = all.find((c) => c.status === "error")?.error;
  const saveError = all.find((c) => c.saveError)?.saveError;

  const inputs: ActivityInputs = useMemo(
    () => ({
      newsNotes: newsNotes.data ?? [],
      instrumentNotes: instrumentNotes.data ?? [],
      reviewLog: reviewLog.data ?? [],
      applications: applications.data ?? [],
      dailyChecks: dailyChecks.data ?? [],
    }),
    [newsNotes.data, instrumentNotes.data, reviewLog.data, applications.data, dailyChecks.data],
  );
  const goalValues = goals.data ?? DEFAULT_GOALS;

  const progress = useMemo(() => weekProgress(inputs, today), [inputs, today]);
  const streakDays = useMemo(() => dailyStreak(activeDays(inputs), today), [inputs, today]);
  const streakWeeks = useMemo(() => weeklyStreak(inputs, goalValues, today), [inputs, goalValues, today]);
  const ca = commercialAwarenessToday(inputs, today);

  return (
    <div className="space-y-6">
      {firstError ? (
        <p role="alert" className="text-sm text-down">
          Couldn&apos;t load some of your data: {firstError}
        </p>
      ) : null}
      {saveError ? (
        <p role="alert" className="text-sm text-down">
          {saveError}
        </p>
      ) : null}

      <section aria-label="Today at a glance" className="grid gap-4 md:grid-cols-3">
        <CardsDueTile />
        <NextDeadlineTile />
        <CommercialAwarenessTile
          ticked={ca.ticked}
          notesToday={ca.notesToday}
          ready={dailyChecks.status === "ready"}
          onToggle={(value) => dailyChecks.update((checks) => setTodayTick(checks, today, value))}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <MarketSnapshot />
        {/* Date-dependent, so only rendered once data has loaded in the browser
            (the page itself is prerendered at build time). */}
        {ready ? (
          <WeeklyGoals
            goals={goalValues}
            progress={progress}
            dailyStreak={streakDays}
            weeklyStreak={streakWeeks}
            ready={ready}
            onSaveGoals={(g) => goals.update(() => g)}
          />
        ) : (
          <div aria-hidden className="h-80 animate-pulse rounded-lg border border-border bg-surface" />
        )}
      </div>
    </div>
  );
}
