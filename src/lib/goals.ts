// Weekly goals and streaks for the home page. Pure functions over the saved
// collections - no I/O. Weeks run Monday to Sunday in UK time.

import { addDays } from "@/lib/srs/leitner";
import { todayIsoDate } from "@/lib/format";
import { STAGE_IDS, type StageId } from "@/lib/applications/model";

export interface Goals {
  notesPerWeek: number;
  cardsPerWeek: number;
  applicationsPerWeek: number;
}

export const DEFAULT_GOALS: Goals = { notesPerWeek: 5, cardsPerWeek: 50, applicationsPerWeek: 2 };

export interface ActivityInputs {
  /** News notes: counted when written (any of the three parts filled). */
  newsNotes: Array<{ savedAt: string; whatHappened: string; whyItMatters: string; whatNext: string }>;
  /** "My take" notes on instruments. */
  instrumentNotes: Array<{ createdAt: string }>;
  reviewLog: Array<{ date: string; reviewed: number }>;
  applications: Array<{ history: Array<{ stage: StageId; at: string }> }>;
  dailyChecks: Array<{ date: string; commercialAwareness: boolean }>;
}

/** UK calendar date (YYYY-MM-DD) of an ISO timestamp. */
export function ukDate(iso: string): string {
  return todayIsoDate(new Date(iso));
}

/** Monday of the week containing `date` (YYYY-MM-DD). */
export function weekStart(date: string): string {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  return addDays(date, day === 0 ? -6 : 1 - day);
}

function written(n: ActivityInputs["newsNotes"][number]): boolean {
  return [n.whatHappened, n.whyItMatters, n.whatNext].some((t) => t.trim().length > 0);
}

/** Moves forward (not to Rejected) whose UK date falls in [start, end]. Each application counts once. */
export function applicationsProgressed(apps: ActivityInputs["applications"], start: string, end: string): number {
  const order = new Map(STAGE_IDS.map((id, i) => [id, i]));
  let count = 0;
  for (const app of apps) {
    let prev = -1;
    let progressed = false;
    for (const step of app.history) {
      const idx = order.get(step.stage) ?? 0;
      const d = ukDate(step.at);
      // The first history entry is creation, not progress.
      if (prev >= 0 && d >= start && d <= end && step.stage !== "rejected" && idx > prev) progressed = true;
      prev = idx;
    }
    if (progressed) count++;
  }
  return count;
}

export interface WeekProgress {
  start: string;
  end: string;
  notes: number;
  cards: number;
  applications: number;
}

export function weekProgress(inputs: ActivityInputs, anyDateInWeek: string): WeekProgress {
  const start = weekStart(anyDateInWeek);
  const end = addDays(start, 6);
  const inWeek = (d: string) => d >= start && d <= end;
  const notes =
    inputs.newsNotes.filter((n) => written(n) && inWeek(ukDate(n.savedAt))).length +
    inputs.instrumentNotes.filter((n) => inWeek(ukDate(n.createdAt))).length;
  const cards = inputs.reviewLog.filter((d) => inWeek(d.date)).reduce((sum, d) => sum + d.reviewed, 0);
  return { start, end, notes, cards, applications: applicationsProgressed(inputs.applications, start, end) };
}

export function goalsMet(p: WeekProgress, goals: Goals): boolean {
  return p.notes >= goals.notesPerWeek && p.cards >= goals.cardsPerWeek && p.applications >= goals.applicationsPerWeek;
}

/** Days with any learning activity: a card reviewed, a note written, or the daily tick. */
export function activeDays(inputs: ActivityInputs): Set<string> {
  const days = new Set<string>();
  for (const d of inputs.reviewLog) if (d.reviewed > 0) days.add(d.date);
  for (const n of inputs.newsNotes) if (written(n)) days.add(ukDate(n.savedAt));
  for (const n of inputs.instrumentNotes) days.add(ukDate(n.createdAt));
  for (const c of inputs.dailyChecks) if (c.commercialAwareness) days.add(c.date);
  return days;
}

/**
 * Consecutive active days ending today. If today has no activity yet, count
 * back from yesterday - so the streak doesn't show 0 every morning.
 */
export function dailyStreak(days: Set<string>, today: string): number {
  let cursor = days.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/**
 * Consecutive weeks with every goal met. The current week counts once its
 * goals are met; otherwise counting starts from last week.
 */
export function weeklyStreak(inputs: ActivityInputs, goals: Goals, today: string, maxWeeks = 104): number {
  let cursor = weekStart(today);
  if (!goalsMet(weekProgress(inputs, cursor), goals)) cursor = addDays(cursor, -7);
  let streak = 0;
  while (streak < maxWeeks && goalsMet(weekProgress(inputs, cursor), goals)) {
    streak++;
    cursor = addDays(cursor, -7);
  }
  return streak;
}

/** Has commercial awareness been done today (ticked, or a news note written)? */
export function commercialAwarenessToday(inputs: ActivityInputs, today: string): { done: boolean; ticked: boolean; notesToday: number } {
  const ticked = inputs.dailyChecks.some((c) => c.date === today && c.commercialAwareness);
  const notesToday = inputs.newsNotes.filter((n) => written(n) && ukDate(n.savedAt) === today).length;
  return { done: ticked || notesToday > 0, ticked, notesToday };
}
