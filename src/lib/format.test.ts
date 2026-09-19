import { describe, expect, it } from "vitest";
import { formatChange, formatPct, formatPrice, formatRelative, todayIsoDate } from "./format";

describe("formatPrice", () => {
  it("shows index levels without a currency symbol", () => {
    expect(formatPrice(10659.13, "index", "GBP")).toBe("10,659.13");
  });

  it("shows LSE shares in pence", () => {
    expect(formatPrice(126.15, "stock", "GBp")).toBe("126.15p");
  });

  it("shows FX to 4 dp and yields as a percentage", () => {
    expect(formatPrice(1.3393, "fx")).toBe("1.3393");
    expect(formatPrice(5.2421, "yield")).toBe("5.242%");
  });

  it("uses currency symbols where known", () => {
    expect(formatPrice(99.29, "commodity", "USD")).toBe("$99.29");
    expect(formatPrice(10, "stock", "CHF")).toBe("10.00 CHF");
  });

  it("never prints NaN", () => {
    expect(formatPrice(null, "index")).toBe("—");
    expect(formatPrice(Number.NaN, "index")).toBe("—");
  });
});

describe("formatChange / formatPct", () => {
  it("signs values with a proper minus", () => {
    expect(formatPct(-0.275)).toBe("−0.28%");
    expect(formatPct(0.2625)).toBe("+0.26%");
    expect(formatPct(0)).toBe("0.00%");
  });

  it("shows yield changes in basis points", () => {
    expect(formatChange(-0.1195, "yield")).toBe("−12.0bp");
  });

  it("shows pence changes with a p", () => {
    expect(formatChange(-5.6, "stock", "GBp")).toBe("−5.60p");
  });
});

describe("dates", () => {
  it("formats relative times", () => {
    const now = Date.parse("2026-09-19T12:00:00Z");
    expect(formatRelative("2026-09-19T11:59:40Z", now)).toBe("just now");
    expect(formatRelative("2026-09-19T11:56:00Z", now)).toBe("4 min ago");
    expect(formatRelative("2026-09-17T12:00:00Z", now)).toBe("2 days ago");
  });

  it("uses the UK date, not UTC, just after midnight in summer", () => {
    // 23:30 UTC on 18 Sep is 00:30 BST on 19 Sep.
    expect(todayIsoDate(new Date("2026-09-18T23:30:00Z"))).toBe("2026-09-19");
  });
});

describe("percentage points", async () => {
  const { formatPp, formatPercent } = await import("./format");
  it("formats pp changes and negative percentages with a proper minus", () => {
    expect(formatPp(-0.25, 2)).toBe("−0.25pp");
    expect(formatPp(0.2)).toBe("+0.2pp");
    expect(formatPercent(-0.1)).toBe("−0.1%");
    expect(formatPercent(3.75, 2)).toBe("3.75%");
  });
});
