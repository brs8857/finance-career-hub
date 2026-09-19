import { z } from "zod";
import { DEFAULT_WATCHLIST, SYMBOL_PATTERN } from "@/lib/markets/instruments";

// Every piece of personal data the app saves is a "collection": one JSON file
// in data/<name>.json. This file defines each collection's shape (validated
// on every write) and its value on first run.
//
// To add a collection: define a schema + default below and add it to
// `collections`. The API route and useCollection() hook pick it up
// automatically.

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");
const id = z.string().min(1).max(64);

// ---------- Markets ----------

export const WatchlistItemSchema = z.object({
  symbol: z.string().regex(SYMBOL_PATTERN),
  name: z.string().min(1).max(120),
  kind: z.enum(["stock", "etf", "index", "fx", "commodity", "yield"]),
  currency: z.string().max(8).nullable().optional(),
});
export type WatchlistItem = z.infer<typeof WatchlistItemSchema>;

export const InstrumentNoteSchema = z.object({
  id,
  symbol: z.string().regex(SYMBOL_PATTERN),
  /** The day the note is about (UK date). */
  date: isoDate,
  text: z.string().min(1).max(4000),
  createdAt: z.string(),
  /**
   * The move the note explains, captured from the live quote when saved.
   * Only recorded for real data - never for sample data.
   */
  context: z
    .object({
      price: z.number(),
      change: z.number().nullable(),
      changePct: z.number().nullable(),
      asOf: z.string().nullable(),
      source: z.string(),
    })
    .optional(),
});
export type InstrumentNote = z.infer<typeof InstrumentNoteSchema>;

// ---------- Registry ----------

export const collections = {
  watchlist: {
    schema: z.array(WatchlistItemSchema).max(100),
    initial: (): WatchlistItem[] => DEFAULT_WATCHLIST.map((item) => ({ ...item })),
  },
  instrumentNotes: {
    schema: z.array(InstrumentNoteSchema).max(5000),
    initial: (): InstrumentNote[] => [],
  },
} as const;

export type CollectionName = keyof typeof collections;
export type CollectionValue<N extends CollectionName> = z.infer<(typeof collections)[N]["schema"]>;

export function isCollectionName(name: string): name is CollectionName {
  return Object.prototype.hasOwnProperty.call(collections, name);
}

/** Short random id for new records. */
export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
