import { describe, expect, it } from "vitest";
import { collections, isCollectionName } from "./collections";

describe("collections", () => {
  it("every initial value passes its own schema", () => {
    for (const [name, def] of Object.entries(collections)) {
      const result = def.schema.safeParse(def.initial());
      expect(result.success, name).toBe(true);
    }
  });

  it("rejects malformed notes", () => {
    const bad = [{ id: "1", symbol: "^FTSE", date: "19/09/2026", text: "x", createdAt: "now" }];
    expect(collections.instrumentNotes.schema.safeParse(bad).success).toBe(false);
  });

  it("recognises only known collection names", () => {
    expect(isCollectionName("watchlist")).toBe(true);
    expect(isCollectionName("__proto__")).toBe(false);
    expect(isCollectionName("secrets")).toBe(false);
  });
});
