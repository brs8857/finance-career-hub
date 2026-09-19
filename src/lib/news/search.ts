import type { NewsNote } from "@/lib/store/collections";

// Archive search: every word must appear somewhere in the note (headline,
// source, the three parts or tags). Case- and accent-insensitive.

function normalise(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function noteHaystack(note: NewsNote): string {
  return normalise(
    [note.headline, note.source, note.whatHappened, note.whyItMatters, note.whatNext, note.tags.join(" ")].join(" "),
  );
}

export function searchNotes(notes: NewsNote[], query: string, tag: string | null = null): NewsNote[] {
  const words = normalise(query).split(/\s+/).filter(Boolean);
  return notes
    .filter((n) => (tag ? n.tags.includes(tag) : true))
    .filter((n) => {
      const hay = noteHaystack(n);
      return words.every((w) => hay.includes(w));
    })
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

/** All tags in use, most used first. */
export function tagCounts(notes: NewsNote[]): Array<{ tag: string; count: number }> {
  const counts = new Map<string, number>();
  for (const n of notes) for (const t of n.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** "rates, UK , Banks" -> ["rates", "uk", "banks"] (lower-case, unique). */
export function parseTags(input: string): string[] {
  return [...new Set(input.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))].slice(0, 20);
}

/** A note counts as "written" once any of the three parts has content. */
export function hasNoteContent(note: Pick<NewsNote, "whatHappened" | "whyItMatters" | "whatNext">): boolean {
  return [note.whatHappened, note.whyItMatters, note.whatNext].some((t) => t.trim().length > 0);
}
