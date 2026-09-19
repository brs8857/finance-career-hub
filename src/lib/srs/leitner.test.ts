import { describe, expect, it } from "vitest";
import { addDays, buildQueue, deckStats, review, type CardProgress } from "./leitner";

const today = "2026-09-19";

describe("review", () => {
  it("moves a new card into box 1 (1 day) or up the boxes on correct answers", () => {
    const first = review(undefined, true, today);
    expect(first).toEqual({ box: 1, due: "2026-09-20", lastReviewed: today, reviews: 1, lapses: 0 });
    const second = review(first, true, "2026-09-20");
    expect(second.box).toBe(2);
    expect(second.due).toBe("2026-09-23"); // +3 days
  });

  it("caps at box 5 with a 30-day interval", () => {
    const top: CardProgress = { box: 5, due: today, lastReviewed: "2026-08-20", reviews: 9, lapses: 0 };
    expect(review(top, true, today)).toMatchObject({ box: 5, due: "2026-10-19", reviews: 10 });
  });

  it("sends a wrong answer back to box 1 and counts a lapse", () => {
    const mid: CardProgress = { box: 4, due: today, lastReviewed: "2026-09-05", reviews: 5, lapses: 0 };
    expect(review(mid, false, today)).toMatchObject({ box: 1, due: "2026-09-20", lapses: 1 });
  });
});

describe("addDays", () => {
  it("crosses month and year ends", () => {
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(addDays("2026-10-24", 2)).toBe("2026-10-26"); // clocks change 25 Oct
  });
});

describe("deckStats / buildQueue", () => {
  const progress: Record<string, CardProgress> = {
    a: { box: 1, due: "2026-09-18", lastReviewed: "2026-09-17", reviews: 1, lapses: 0 },
    b: { box: 3, due: "2026-09-19", lastReviewed: "2026-09-12", reviews: 3, lapses: 0 },
    c: { box: 5, due: "2026-10-10", lastReviewed: "2026-09-10", reviews: 7, lapses: 0 },
    d: { box: 2, due: "2026-09-18", lastReviewed: "2026-09-15", reviews: 2, lapses: 1 },
  };
  const ids = ["a", "b", "c", "d", "e", "f", "g"];

  it("counts due, new and mastered", () => {
    expect(deckStats(ids, progress, today)).toEqual({ total: 7, due: 3, fresh: 3, mastered: 1 });
  });

  it("queues overdue first (lowest box on ties), then limited new cards", () => {
    expect(buildQueue(ids, progress, today, 2)).toEqual(["a", "d", "b", "e", "f"]);
  });
});
