import { describe, expect, it } from "vitest";
import { parseTreasuryCsv, tenorYears } from "./treasury";

describe("tenorYears", () => {
  it("converts Treasury headers to years", () => {
    expect(tenorYears('"1 Mo"')).toBeCloseTo(1 / 12);
    expect(tenorYears('"1.5 Month"')).toBeCloseTo(0.125);
    expect(tenorYears('"10 Yr"')).toBe(10);
    expect(tenorYears("Date")).toBeNull();
  });
});

describe("parseTreasuryCsv", () => {
  // Real header and rows from 2026-09-19.
  const csv = [
    'Date,"1 Mo","1.5 Month","2 Mo","3 Mo","4 Mo","6 Mo","1 Yr","2 Yr","3 Yr","5 Yr","7 Yr","10 Yr","20 Yr","30 Yr"',
    "09/17/2026,3.97,3.98,4.09,4.12,4.23,4.20,4.40,4.67,4.75,4.78,4.86,4.94,5.32,5.29",
    "09/18/2026,3.97,3.98,4.10,4.14,4.24,4.24,4.44,4.76,4.83,4.86,4.93,5.01,5.38,,",
  ].join("\n");

  it("returns the newest row regardless of order, skipping blank cells", () => {
    const curve = parseTreasuryCsv(csv);
    expect(curve?.date).toBe("2026-09-18");
    expect(curve?.points).toHaveLength(13); // 30Y blank
    expect(curve?.points.find((p) => p.years === 10)?.value).toBe(5.01);
    expect(curve?.points[0].label).toBe("1M");
  });

  it("returns null for a header-only file (early January)", () => {
    expect(parseTreasuryCsv(csv.split("\n")[0])).toBeNull();
  });
});
