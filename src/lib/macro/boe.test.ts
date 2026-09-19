import { describe, expect, it } from "vitest";
import { parseBoeCsv, parseBoeDate } from "./boe";

describe("parseBoeDate", () => {
  it("converts IADB dates to ISO", () => {
    expect(parseBoeDate("01 Sep 2026")).toBe("2026-09-01");
    expect(parseBoeDate("16 Dec 2025")).toBe("2025-12-16");
  });

  it("rejects anything else", () => {
    expect(parseBoeDate("2026-09-01")).toBeNull();
    expect(parseBoeDate("01 Foo 2026")).toBeNull();
  });
});

describe("parseBoeCsv", () => {
  // Real response shape from 2026-09-19 (Windows line endings included).
  const csv = "DATE,IUDMNPY\r\n14 Sep 2026,5.3699\r\n16 Sep 2026,5.2421\r\n15 Sep 2026,5.3616\r\n";

  it("parses and sorts by date", () => {
    expect(parseBoeCsv(csv).IUDMNPY).toEqual([
      { date: "2026-09-14", value: 5.3699 },
      { date: "2026-09-15", value: 5.3616 },
      { date: "2026-09-16", value: 5.2421 },
    ]);
  });

  it("handles several series and skips blank cells", () => {
    const out = parseBoeCsv("DATE,A,B\n01 Sep 2026,1.5,\n02 Sep 2026,1.6,2.5\n");
    expect(out.A).toHaveLength(2);
    expect(out.B).toEqual([{ date: "2026-09-02", value: 2.5 }]);
  });

  it("throws on non-CSV (e.g. an HTML error page)", () => {
    expect(() => parseBoeCsv("<html>error</html>")).toThrow(/unexpected CSV/);
  });
});
