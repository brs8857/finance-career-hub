import { describe, expect, it } from "vitest";
import { parseOnsPeriod, parseOnsSeries, pickFreshest } from "./ons";

describe("parseOnsPeriod", () => {
  it("handles months and quarters", () => {
    expect(parseOnsPeriod("2026 AUG")).toEqual({ date: "2026-08-01", label: "Aug 2026" });
    expect(parseOnsPeriod("2026 Q2")).toEqual({ date: "2026-04-01", label: "Q2 2026" });
    expect(parseOnsPeriod("2026 Q4")).toEqual({ date: "2026-10-01", label: "Q4 2026" });
    expect(parseOnsPeriod("2026")).toBeNull();
  });
});

describe("parseOnsSeries", () => {
  it("parses, sorts and skips blank values rather than treating them as zero", () => {
    const s = parseOnsSeries(
      {
        description: { title: "CPI ANNUAL RATE", releaseDate: "2026-09-15T23:00:00.000Z", nextRelease: "21 October 2026" },
        months: [
          { date: "2026 AUG", value: "3.1" },
          { date: "2026 JUN", value: "2.6" },
          { date: "2026 JUL", value: "" },
        ],
      },
      "months",
    );
    expect(s.observations.map((o) => [o.label, o.value])).toEqual([
      ["Jun 2026", 2.6],
      ["Aug 2026", 3.1],
    ]);
    expect(s.nextRelease).toBe("21 October 2026");
  });
});

describe("pickFreshest", () => {
  const mk = (last: string, release: string) => ({
    title: "",
    releaseDate: release,
    nextRelease: null,
    observations: [{ date: last, label: "", value: 0 }],
  });

  it("prefers the dataset with the later observation (PN2 had Q2 2026, QNA only Q1)", () => {
    const pn2 = { ...mk("2026-04-01", "2026-08-12"), dataset: "PN2" };
    const qna = { ...mk("2026-01-01", "2026-06-29"), dataset: "QNA" };
    expect(pickFreshest([pn2, qna]).dataset).toBe("PN2");
    expect(pickFreshest([qna, pn2]).dataset).toBe("PN2");
  });

  it("breaks ties with the later release (revised figures)", () => {
    const a = { ...mk("2026-04-01", "2026-08-12"), dataset: "PN2" };
    const b = { ...mk("2026-04-01", "2026-09-30"), dataset: "QNA" };
    expect(pickFreshest([a, b]).dataset).toBe("QNA");
  });
});
