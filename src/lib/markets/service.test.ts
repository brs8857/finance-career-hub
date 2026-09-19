import { describe, expect, it } from "vitest";
import { giltHistoryFrom, giltQuoteFrom } from "./service";

const series = [
  { date: "2025-09-15", value: 4.6 },
  { date: "2025-09-16", value: 4.65 },
  { date: "2026-08-20", value: 5.0 },
  { date: "2026-09-10", value: 5.319 },
  { date: "2026-09-15", value: 5.3616 },
  { date: "2026-09-16", value: 5.2421 },
];

describe("giltQuoteFrom", () => {
  it("uses the last two observations and dates the quote by observation", () => {
    const q = giltQuoteFrom(series);
    expect(q.price).toBe(5.2421);
    expect(q.previousClose).toBe(5.3616);
    expect(q.change).toBeCloseTo(-0.1195, 10);
    expect(q.asOf).toBe("2026-09-16T00:00:00.000Z");
  });
});

describe("giltHistoryFrom", () => {
  it("measures ranges back from the latest observation, not from today", () => {
    expect(giltHistoryFrom(series, "1W").map((p) => p.v)).toEqual([5.319, 5.3616, 5.2421]);
    expect(giltHistoryFrom(series, "1M")).toHaveLength(4);
    // Same calendar date a year earlier is in; the day before is out.
    expect(giltHistoryFrom(series, "1Y").map((p) => p.v)[0]).toBe(4.65);
  });
});
