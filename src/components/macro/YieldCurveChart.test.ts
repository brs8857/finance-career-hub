import { describe, expect, it } from "vitest";
import { slopeBp } from "./YieldCurveChart";

// US Treasury curve, 18 Sep 2026.
const us = [
  { years: 0.25, label: "3M", value: 4.14 },
  { years: 2, label: "2Y", value: 4.76 },
  { years: 10, label: "10Y", value: 5.01 },
];

describe("slopeBp", () => {
  it("computes long minus short in basis points", () => {
    expect(slopeBp(us, 10, 2)).toBe(25);
    expect(slopeBp(us, 10, 0.25)).toBe(87);
  });

  it("is negative when inverted and null when a maturity is missing", () => {
    expect(slopeBp(us, 0.25, 10)).toBe(-87);
    expect(slopeBp(us, 30, 2)).toBeNull();
  });
});
