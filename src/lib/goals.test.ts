import { describe, expect, it } from "vitest";
import {
  activeDays,
  applicationsProgressed,
  commercialAwarenessToday,
  dailyStreak,
  DEFAULT_GOALS,
  weekProgress,
  weeklyStreak,
  weekStart,
  type ActivityInputs,
} from "./goals";

const empty: ActivityInputs = { newsNotes: [], instrumentNotes: [], reviewLog: [], applications: [], dailyChecks: [] };
const note = (savedAt: string, text = "x") => ({ savedAt, whatHappened: text, whyItMatters: "", whatNext: "" });

describe("weekStart", () => {
  it("returns the Monday (UK weeks run Mon-Sun)", () => {
    expect(weekStart("2026-09-19")).toBe("2026-09-14"); // Saturday
    expect(weekStart("2026-09-20")).toBe("2026-09-14"); // Sunday
    expect(weekStart("2026-09-14")).toBe("2026-09-14"); // Monday
  });
});

describe("weekProgress", () => {
  it("counts written notes, cards and progressed applications in the UK week", () => {
    const inputs: ActivityInputs = {
      ...empty,
      newsNotes: [note("2026-09-15T10:00:00Z"), note("2026-09-15T11:00:00Z", ""), note("2026-09-13T22:30:00Z")],
      instrumentNotes: [{ createdAt: "2026-09-16T09:00:00Z" }],
      reviewLog: [
        { date: "2026-09-14", reviewed: 20 },
        { date: "2026-09-19", reviewed: 15 },
        { date: "2026-09-13", reviewed: 99 },
      ],
    };
    // 13 Sep 22:30 UTC is 23:30 BST on Sunday 13 Sep - last week. Blank notes don't count.
    expect(weekProgress(inputs, "2026-09-19")).toEqual({
      start: "2026-09-14",
      end: "2026-09-20",
      notes: 2,
      cards: 35,
      applications: 0,
    });
  });

  it("counts an application moving forward, but not creation, rejection or going backwards", () => {
    const apps = [
      { history: [{ stage: "researching" as const, at: "2026-09-15T09:00:00Z" }] },
      {
        history: [
          { stage: "researching" as const, at: "2026-09-01T09:00:00Z" },
          { stage: "applied" as const, at: "2026-09-16T09:00:00Z" },
          { stage: "tests" as const, at: "2026-09-17T09:00:00Z" },
        ],
      },
      {
        history: [
          { stage: "applied" as const, at: "2026-09-01T09:00:00Z" },
          { stage: "rejected" as const, at: "2026-09-16T09:00:00Z" },
        ],
      },
    ];
    expect(applicationsProgressed(apps, "2026-09-14", "2026-09-20")).toBe(1);
  });
});

describe("dailyStreak", () => {
  it("counts back from today, or from yesterday if nothing yet today", () => {
    const days = new Set(["2026-09-16", "2026-09-17", "2026-09-18"]);
    expect(dailyStreak(days, "2026-09-19")).toBe(3);
    days.add("2026-09-19");
    expect(dailyStreak(days, "2026-09-19")).toBe(4);
    expect(dailyStreak(new Set(["2026-09-15"]), "2026-09-19")).toBe(0);
  });

  it("treats any activity as a streak day", () => {
    const inputs: ActivityInputs = {
      ...empty,
      reviewLog: [{ date: "2026-09-17", reviewed: 3 }],
      newsNotes: [note("2026-09-18T12:00:00Z")],
      dailyChecks: [{ date: "2026-09-19", commercialAwareness: true }],
    };
    expect(dailyStreak(activeDays(inputs), "2026-09-19")).toBe(3);
  });
});

describe("weeklyStreak", () => {
  const goals = { ...DEFAULT_GOALS, notesPerWeek: 1, cardsPerWeek: 10, applicationsPerWeek: 0 };
  const week = (monday: string) => ({ note: note(`${monday}T12:00:00Z`), log: { date: monday, reviewed: 10 } });

  it("counts consecutive completed weeks, including this week once met", () => {
    const weeks = ["2026-08-31", "2026-09-07"].map(week);
    const inputs: ActivityInputs = { ...empty, newsNotes: weeks.map((w) => w.note), reviewLog: weeks.map((w) => w.log) };
    expect(weeklyStreak(inputs, goals, "2026-09-19")).toBe(2); // this week not met yet
    const thisWeek = week("2026-09-14");
    inputs.newsNotes.push(thisWeek.note);
    inputs.reviewLog.push(thisWeek.log);
    expect(weeklyStreak(inputs, goals, "2026-09-19")).toBe(3);
  });
});

describe("commercialAwarenessToday", () => {
  it("is done if ticked or a note was written today", () => {
    expect(commercialAwarenessToday(empty, "2026-09-19").done).toBe(false);
    expect(commercialAwarenessToday({ ...empty, newsNotes: [note("2026-09-19T08:00:00Z")] }, "2026-09-19")).toEqual({
      done: true,
      ticked: false,
      notesToday: 1,
    });
  });
});
