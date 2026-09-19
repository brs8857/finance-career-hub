export type DeckId = "accounting" | "corporate-finance" | "economics" | "my-cards";

export interface Flashcard {
  /** Stable id - progress is stored against it, so never change an existing id. */
  id: string;
  deckId: DeckId;
  front: string;
  back: string;
  /** Short topic label, e.g. "Double entry". */
  topic?: string;
}

export interface Deck {
  id: DeckId;
  name: string;
  description: string;
}
