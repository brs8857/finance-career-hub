import { describe, expect, it } from "vitest";
import { ACCOUNTING } from "./accounting";
import { CORPORATE_FINANCE } from "./corporate-finance";
import { ECONOMICS } from "./economics";
import { DECKS, SEEDED_CARDS } from "./index";

describe("seeded decks", () => {
  it("has about 20 cards per deck", () => {
    for (const deck of [ACCOUNTING, CORPORATE_FINANCE, ECONOMICS]) {
      expect(deck.length).toBeGreaterThanOrEqual(18);
      expect(deck.length).toBeLessThanOrEqual(25);
    }
  });

  it("uses unique, permanent-looking ids (progress is keyed on them)", () => {
    const ids = SEEDED_CARDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^(acc|cf|eco)-\d{2}$/);
  });

  it("files every card in the right deck with real content", () => {
    const expected = { acc: "accounting", cf: "corporate-finance", eco: "economics" } as const;
    for (const card of SEEDED_CARDS) {
      expect(card.deckId).toBe(expected[card.id.split("-")[0] as keyof typeof expected]);
      expect(card.front.trim().length).toBeGreaterThan(10);
      expect(card.back.trim().length).toBeGreaterThan(10);
      expect(DECKS.some((d) => d.id === card.deckId)).toBe(true);
    }
  });
});
