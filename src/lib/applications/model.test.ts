import { describe, expect, it } from "vitest";
import { countdownLabel, daysUntil, moveToStage, nextDeadline, openDeadlines, progressedSince, urgencyOf } from "./model";
import type { StageId } from "./model";

describe("daysUntil / countdownLabel", () => {
  it("counts whole UK calendar days", () => {
    expect(daysUntil("2026-09-26", "2026-09-19")).toBe(7);
    expect(daysUntil("2026-09-19", "2026-09-19")).toBe(0);
    expect(daysUntil("2026-09-17", "2026-09-19")).toBe(-2);
  });

  it("is unaffected by the clocks going back (25 Oct 2026)", () => {
    expect(daysUntil("2026-10-26", "2026-10-24")).toBe(2);
  });

  it("labels the countdown", () => {
    expect(countdownLabel(0)).toBe("Due today");
    expect(countdownLabel(1)).toBe("Due tomorrow");
    expect(countdownLabel(12)).toBe("12 days left");
    expect(countdownLabel(-1)).toBe("1 day overdue");
    expect(countdownLabel(-3)).toBe("3 days overdue");
  });

  it("buckets urgency", () => {
    expect([urgencyOf(-1), urgencyOf(0), urgencyOf(7), urgencyOf(8), urgencyOf(31)]).toEqual([
      "overdue", "urgent", "urgent", "soon", "later",
    ]);
  });
});

const app = (id: string, stage: StageId, deadline: string | null) => ({ id, stage, deadline });

describe("deadlines", () => {
  const apps = [
    app("submitted", "applied", "2026-09-20"),
    app("later", "researching", "2026-11-01"),
    app("overdue", "applying", "2026-09-10"),
    app("soon", "applying", "2026-09-22"),
    app("none", "researching", null),
  ];

  it("lists only unsubmitted applications with deadlines, soonest first", () => {
    expect(openDeadlines(apps, "2026-09-19").map((a) => [a.id, a.days])).toEqual([
      ["overdue", -9],
      ["soon", 3],
      ["later", 43],
    ]);
  });

  it("next deadline skips overdue ones", () => {
    expect(nextDeadline(apps, "2026-09-19")?.id).toBe("soon");
    expect(nextDeadline([], "2026-09-19")).toBeNull();
  });
});

describe("stage history", () => {
  const base = { stage: "researching" as StageId, history: [{ stage: "researching" as StageId, at: "2026-09-01T09:00:00Z" }] };

  it("records moves and ignores no-op moves", () => {
    const moved = moveToStage(base, "applied", new Date("2026-09-18T10:00:00Z"));
    expect(moved.stage).toBe("applied");
    expect(moved.history.at(-1)).toEqual({ stage: "applied", at: "2026-09-18T10:00:00.000Z" });
    expect(moveToStage(moved, "applied")).toBe(moved);
  });

  it("counts applications that moved forward this week, once each", () => {
    const a = moveToStage(moveToStage(base, "applying", new Date("2026-09-15T09:00:00Z")), "applied", new Date("2026-09-16T09:00:00Z"));
    const rejected = moveToStage(base, "rejected", new Date("2026-09-16T09:00:00Z"));
    const old = moveToStage(base, "applied", new Date("2026-09-01T09:00:00Z"));
    const backwards = moveToStage(moveToStage(base, "interview", new Date("2026-09-01T09:00:00Z")), "applied", new Date("2026-09-16T09:00:00Z"));
    expect(progressedSince([a, rejected, old, backwards], "2026-09-14T00:00:00Z")).toBe(1);
  });
});
