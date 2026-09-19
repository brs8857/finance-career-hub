import { describe, expect, it } from "vitest";
import { parseFredObservations } from "./fred";

describe("parseFredObservations", () => {
  it("skips FRED's '.' missing-value marker", () => {
    expect(
      parseFredObservations({
        observations: [
          { date: "2026-07-01", value: "4.2" },
          { date: "2026-08-01", value: "." },
          { date: "2026-09-01", value: "4.3" },
        ],
      }),
    ).toEqual([
      { date: "2026-07-01", value: 4.2 },
      { date: "2026-09-01", value: 4.3 },
    ]);
  });
});
