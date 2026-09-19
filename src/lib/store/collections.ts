import { z } from "zod";
import { ROUTE_IDS, STAGE_IDS } from "@/lib/applications/model";
import { DEFAULT_GOALS } from "@/lib/goals";
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

// ---------- Commercial awareness ----------

/** A saved headline plus the user's three-part note. Headline + link only, never article text. */
export const NewsNoteSchema = z.object({
  id,
  headline: z.string().min(1).max(400),
  url: z.string().url().max(2000).refine((u) => /^https?:\/\//.test(u), "Must be an http(s) link"),
  source: z.string().max(80),
  publishedAt: z.string().nullable(),
  savedAt: z.string(),
  updatedAt: z.string(),
  whatHappened: z.string().max(4000),
  whyItMatters: z.string().max(4000),
  whatNext: z.string().max(4000),
  tags: z.array(z.string().min(1).max(40)).max(20),
});
export type NewsNote = z.infer<typeof NewsNoteSchema>;

// ---------- Applications ----------

const httpUrl = z
  .string()
  .max(2000)
  .refine((u) => u === "" || /^https?:\/\//.test(u), "Must start with http:// or https://");

export const ContactSchema = z.object({
  id,
  name: z.string().min(1).max(120),
  role: z.string().max(120),
  email: z.string().max(200),
  notes: z.string().max(2000),
});
export type Contact = z.infer<typeof ContactSchema>;

/** One application. Entered by the user - the app never pre-fills employers or deadlines. */
export const ApplicationSchema = z.object({
  id,
  employer: z.string().min(1).max(120),
  role: z.string().max(160),
  route: z.enum(ROUTE_IDS),
  stage: z.enum(STAGE_IDS),
  /** YYYY-MM-DD, or null if none / not known yet. */
  deadline: isoDate.nullable(),
  /** Recruits on a rolling basis: may close before the deadline. */
  rolling: z.boolean(),
  link: httpUrl,
  notes: z.string().max(8000),
  contacts: z.array(ContactSchema).max(50),
  history: z.array(z.object({ stage: z.enum(STAGE_IDS), at: z.string() })).max(200),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Application = z.infer<typeof ApplicationSchema>;

// ---------- Flashcards ----------

/** Leitner progress per card id (seeded or custom). */
export const CardProgressSchema = z.object({
  box: z.number().int().min(1).max(5),
  due: isoDate,
  lastReviewed: isoDate,
  reviews: z.number().int().min(0),
  lapses: z.number().int().min(0),
});

export const CustomCardSchema = z.object({
  id: z.string().regex(/^my-[a-z0-9-]+$/),
  deckId: z.enum(["accounting", "corporate-finance", "economics", "my-cards"]),
  front: z.string().min(1).max(1000),
  back: z.string().min(1).max(4000),
  createdAt: z.string(),
});
export type CustomCard = z.infer<typeof CustomCardSchema>;

/** One row per day studied - used for streaks and weekly goals. */
export const ReviewDaySchema = z.object({
  date: isoDate,
  reviewed: z.number().int().min(0),
  correct: z.number().int().min(0),
});
export type ReviewDay = z.infer<typeof ReviewDaySchema>;

// ---------- Home: goals and daily checks ----------

export const GoalsSchema = z.object({
  notesPerWeek: z.number().int().min(0).max(100),
  cardsPerWeek: z.number().int().min(0).max(2000),
  applicationsPerWeek: z.number().int().min(0).max(100),
});

export const DailyCheckSchema = z.object({
  date: isoDate,
  commercialAwareness: z.boolean(),
});
export type DailyCheck = z.infer<typeof DailyCheckSchema>;

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
  newsNotes: {
    schema: z.array(NewsNoteSchema).max(5000),
    initial: (): NewsNote[] => [],
  },
  applications: {
    schema: z.array(ApplicationSchema).max(1000),
    initial: (): Application[] => [],
  },
  cardProgress: {
    schema: z.record(z.string().max(64), CardProgressSchema),
    initial: (): Record<string, z.infer<typeof CardProgressSchema>> => ({}),
  },
  customCards: {
    schema: z.array(CustomCardSchema).max(2000),
    initial: (): CustomCard[] => [],
  },
  reviewLog: {
    schema: z.array(ReviewDaySchema).max(4000),
    initial: (): ReviewDay[] => [],
  },
  goals: {
    schema: GoalsSchema,
    initial: () => ({ ...DEFAULT_GOALS }),
  },
  dailyChecks: {
    schema: z.array(DailyCheckSchema).max(4000),
    initial: (): DailyCheck[] => [],
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
