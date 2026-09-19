import { describe, expect, it } from "vitest";
import { parseTdQuote, parseTdSeries, toTwelveSymbol } from "./twelvedata";

describe("toTwelveSymbol", () => {
  it("maps supported symbols and rejects paid-plan ones", () => {
    expect(toTwelveSymbol("GBPUSD=X")).toBe("GBP/USD");
    expect(toTwelveSymbol("AAPL")).toBe("AAPL");
    expect(toTwelveSymbol("^FTSE")).toBeNull();
    expect(toTwelveSymbol("VOD.L")).toBeNull();
    expect(toTwelveSymbol("BRK-B")).toBe("BRK.B");
  });
});

describe("parsers", () => {
  it("parses string numbers in quotes", () => {
    expect(parseTdQuote("AAPL", { close: "336.13", previous_close: "337", change: "-0.87", percent_change: "-0.258" }))
      .toMatchObject({ price: 336.13, previousClose: 337, change: -0.87, changePct: -0.258 });
    expect(parseTdQuote("AAPL", { close: "n/a" })).toBeNull();
  });

  it("returns series oldest-first", () => {
    const points = parseTdSeries({
      values: [
        { datetime: "2026-09-18", close: "3" },
        { datetime: "2026-09-17", close: "2" },
      ],
    });
    expect(points.map((p) => p.v)).toEqual([2, 3]);
    expect(points[0].t).toBe(Date.parse("2026-09-17T00:00:00Z"));
  });
});
