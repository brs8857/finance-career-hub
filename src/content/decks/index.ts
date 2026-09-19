import { ACCOUNTING } from "./accounting";
import { CORPORATE_FINANCE } from "./corporate-finance";
import { ECONOMICS } from "./economics";
import type { Deck, DeckId, Flashcard } from "./types";

export type { Deck, DeckId, Flashcard } from "./types";

export const DECKS: Deck[] = [
  {
    id: "accounting",
    name: "Accounting",
    description: "The three statements, double entry and depreciation.",
  },
  {
    id: "corporate-finance",
    name: "Corporate finance",
    description: "DCF, WACC, P/E and enterprise value vs equity value.",
  },
  {
    id: "economics",
    name: "Economics",
    description: "Elasticity, the multiplier and monetary policy transmission.",
  },
  {
    id: "my-cards",
    name: "My cards",
    description: "Cards you've written yourself.",
  },
];

export const SEEDED_CARDS: Flashcard[] = [...ACCOUNTING, ...CORPORATE_FINANCE, ...ECONOMICS];

export function deckName(id: DeckId): string {
  return DECKS.find((d) => d.id === id)?.name ?? id;
}

export function isDeckId(value: string): value is DeckId {
  return DECKS.some((d) => d.id === value);
}
