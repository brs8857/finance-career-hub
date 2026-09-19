import { describe, expect, it } from "vitest";
import { PATHWAYS } from "./pathways";

describe("pathways", () => {
  it("covers all nine requested routes with unique ids", () => {
    expect(PATHWAYS.map((p) => p.id)).toEqual([
      "aca", "acca", "cima", "investment-banking", "sales-trading", "asset-management",
      "economic-consulting", "ges", "central-banking",
    ]);
  });

  it("gives every route all four sections and at least one https source", () => {
    for (const p of PATHWAYS) {
      expect(p.whatItInvolves.length, p.id).toBeGreaterThan(0);
      expect(p.entryRoutes.length, p.id).toBeGreaterThan(0);
      expect(p.qualifications.length, p.id).toBeGreaterThan(0);
      expect(p.atYourStage.length, p.id).toBeGreaterThan(0);
      expect(p.sources.length, p.id).toBeGreaterThan(0);
      for (const s of p.sources) expect(s.url).toMatch(/^https:\/\//);
    }
  });
});
