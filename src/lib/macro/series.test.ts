import { describe, expect, it } from "vitest";
import { latestCommonUkCurve } from "./service";
import { lastChange, monthlyFromDaily, quarterLabel } from "./series";

describe("monthlyFromDaily", () => {
  it("keeps each month's last value and ends on the latest day", () => {
    const out = monthlyFromDaily([
      { date: "2026-07-30", value: 4 },
      { date: "2026-07-31", value: 4 },
      { date: "2026-08-07", value: 3.75 },
      { date: "2026-09-16", value: 3.75 },
    ]);
    expect(out.map((o) => [o.date, o.label, o.value])).toEqual([
      ["2026-07-01", "Jul 2026", 4],
      ["2026-08-01", "Aug 2026", 3.75],
      ["2026-09-16", "16 Sep 2026", 3.75],
    ]);
  });
});

describe("lastChange", () => {
  it("finds the most recent rate decision", () => {
    expect(
      lastChange([
        { date: "2026-08-06", value: 4 },
        { date: "2026-08-07", value: 3.75 },
        { date: "2026-09-16", value: 3.75 },
      ]),
    ).toEqual({ date: "2026-08-07", from: 4, to: 3.75 });
    expect(lastChange([{ date: "2026-01-01", value: 1 }])).toBeNull();
  });
});

describe("quarterLabel", () => {
  it("labels FRED quarter-start dates", () => {
    expect(quarterLabel("2026-04-01")).toBe("Q2 2026");
  });
});

describe("latestCommonUkCurve", () => {
  it("uses the latest date on which every maturity has a value", () => {
    const curve = latestCommonUkCurve({
      IUDSOIA: [
        { date: "2026-09-15", value: 3.73 },
        { date: "2026-09-16", value: 3.73 },
      ],
      IUDSNPY: [{ date: "2026-09-15", value: 4.9 }],
      IUDMNPY: [
        { date: "2026-09-15", value: 5.36 },
        { date: "2026-09-16", value: 5.24 },
      ],
      IUDLNPY: [{ date: "2026-09-15", value: 5.72 }],
    });
    expect(curve?.date).toBe("2026-09-15");
    expect(curve?.points.map((p) => p.label)).toEqual(["O/N", "5Y", "10Y", "20Y"]);
  });
});
