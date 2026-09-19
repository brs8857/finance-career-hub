// Application tracker domain: stages, routes and deadline maths.
// Pure functions, no I/O - safe on server and client, easy to test.

export const STAGES = [
  { id: "researching", label: "Researching" },
  { id: "applying", label: "Applying" },
  { id: "applied", label: "Applied" },
  { id: "tests", label: "Online tests" },
  { id: "interview", label: "Interview" },
  { id: "offer", label: "Offer" },
  { id: "rejected", label: "Rejected" },
] as const;

export type StageId = (typeof STAGES)[number]["id"];
export const STAGE_IDS = STAGES.map((s) => s.id) as [StageId, ...StageId[]];

export const ROUTES = [
  { id: "spring-week", label: "Spring week" },
  { id: "internship", label: "Internship" },
  { id: "grad-scheme", label: "Graduate scheme" },
  { id: "apprenticeship", label: "Apprenticeship" },
  { id: "degree-apprenticeship", label: "Degree apprenticeship" },
] as const;

export type RouteId = (typeof ROUTES)[number]["id"];
export const ROUTE_IDS = ROUTES.map((r) => r.id) as [RouteId, ...RouteId[]];

export function stageLabel(id: StageId): string {
  return STAGES.find((s) => s.id === id)?.label ?? id;
}

export function routeLabel(id: RouteId): string {
  return ROUTES.find((r) => r.id === id)?.label ?? id;
}

/** Stages where a deadline still matters (you haven't submitted yet). */
export const PRE_SUBMISSION: readonly StageId[] = ["researching", "applying"];

/** Whole days from `today` to `deadline` (both YYYY-MM-DD). Negative = overdue. */
export function daysUntil(deadline: string, today: string): number {
  const ms = Date.parse(`${deadline}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

export function countdownLabel(days: number): string {
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days > 1) return `${days} days left`;
  if (days === -1) return "1 day overdue";
  return `${-days} days overdue`;
}

export type Urgency = "overdue" | "urgent" | "soon" | "later";

export function urgencyOf(days: number): Urgency {
  if (days < 0) return "overdue";
  if (days <= 7) return "urgent";
  if (days <= 30) return "soon";
  return "later";
}

interface HasDeadline {
  stage: StageId;
  deadline: string | null;
}

/** Upcoming (and overdue) deadlines for applications not yet submitted, soonest first. */
export function openDeadlines<T extends HasDeadline>(
  apps: T[],
  today: string,
): Array<T & { deadline: string; days: number }> {
  return apps
    .filter((a): a is T & { deadline: string } => !!a.deadline && PRE_SUBMISSION.includes(a.stage))
    .map((a) => ({ ...a, days: daysUntil(a.deadline, today) }))
    .sort((a, b) => a.days - b.days);
}

/** The next deadline that hasn't passed, or null. Used on the home page. */
export function nextDeadline<T extends HasDeadline>(
  apps: T[],
  today: string,
): (T & { deadline: string; days: number }) | null {
  return openDeadlines(apps, today).find((a) => a.days >= 0) ?? null;
}

interface HasHistory {
  stage: StageId;
  history: Array<{ stage: StageId; at: string }>;
}

/** Move to a new stage, recording when. No-op if already there. */
export function moveToStage<T extends HasHistory>(app: T, stage: StageId, now: Date = new Date()): T {
  if (app.stage === stage) return app;
  return { ...app, stage, history: [...app.history, { stage, at: now.toISOString() }] };
}

/**
 * How many applications moved forward since `sinceIso` (for the weekly goal).
 * Counts each application once; moves to "rejected" or backwards don't count.
 */
export function progressedSince(apps: HasHistory[], sinceIso: string): number {
  const order = new Map(STAGE_IDS.map((id, i) => [id, i]));
  let count = 0;
  for (const app of apps) {
    let prevIndex = 0;
    let progressed = false;
    for (const step of app.history) {
      const idx = order.get(step.stage) ?? 0;
      if (step.at >= sinceIso && step.stage !== "rejected" && idx > prevIndex) progressed = true;
      prevIndex = idx;
    }
    if (progressed) count++;
  }
  return count;
}
