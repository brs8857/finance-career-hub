import { describe, expect, it } from "vitest";
import { dayGroupLabel } from "@/lib/format";
import type { NewsNote } from "@/lib/store/collections";
import { hasNoteContent, parseTags, searchNotes, tagCounts } from "./search";

const note = (id: string, fields: Partial<NewsNote>): NewsNote => ({
  id,
  headline: "",
  url: "https://example.com/" + id,
  source: "BBC Business",
  publishedAt: null,
  savedAt: `2026-09-${id.padStart(2, "0")}T09:00:00Z`,
  updatedAt: "",
  whatHappened: "",
  whyItMatters: "",
  whatNext: "",
  tags: [],
  ...fields,
});

const notes = [
  note("1", { headline: "Bank of England holds rates", whyItMatters: "Mortgage costs stay high", tags: ["rates", "uk"] }),
  note("2", { headline: "Oil jumps above $100", whatNext: "Petrol prices may feed into CPI", tags: ["commodities"] }),
  note("3", { headline: "Nestlé cuts guidance", tags: ["consumer"] }),
];

describe("searchNotes", () => {
  it("requires every word, across all fields, newest first", () => {
    expect(searchNotes(notes, "mortgage bank").map((n) => n.id)).toEqual(["1"]);
    expect(searchNotes(notes, "CPI").map((n) => n.id)).toEqual(["2"]);
    expect(searchNotes(notes, "").map((n) => n.id)).toEqual(["3", "2", "1"]);
  });

  it("ignores accents and filters by tag", () => {
    expect(searchNotes(notes, "nestle").map((n) => n.id)).toEqual(["3"]);
    expect(searchNotes(notes, "", "uk").map((n) => n.id)).toEqual(["1"]);
  });
});

describe("tags", () => {
  it("parses comma lists into unique lower-case tags", () => {
    expect(parseTags(" Rates, UK ,rates,, Banks ")).toEqual(["rates", "uk", "banks"]);
  });

  it("counts tags by use", () => {
    expect(tagCounts([...notes, note("4", { tags: ["uk"] })])[0]).toEqual({ tag: "uk", count: 2 });
  });
});

describe("hasNoteContent", () => {
  it("treats a bookmark with blank fields as not written yet", () => {
    expect(hasNoteContent(note("5", {}))).toBe(false);
    expect(hasNoteContent(note("6", { whatNext: " x " }))).toBe(true);
  });
});

describe("dayGroupLabel", () => {
  it("groups by UK calendar day", () => {
    const now = new Date("2026-09-19T12:00:00Z");
    expect(dayGroupLabel("2026-09-19T00:30:00+01:00", now)).toBe("Today");
    expect(dayGroupLabel("2026-09-18T22:30:00Z", now)).toBe("Yesterday");
    expect(dayGroupLabel("2026-09-17T09:00:00Z", now)).toBe("Thu 17 Sept");
  });
});
