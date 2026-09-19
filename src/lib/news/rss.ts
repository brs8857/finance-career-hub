import { XMLParser } from "fast-xml-parser";
import type { Headline } from "./types";

// RSS 2.0 (and basic Atom) -> headlines. Deliberately extracts ONLY the
// title, link and date. Descriptions/content are article text and are never
// read, stored or shown.

const parser = new XMLParser({
  ignoreAttributes: false,
  htmlEntities: true,
  // Don't let a huge or hostile feed expand entities without limit.
  processEntities: true,
});

type Node = string | { "#text"?: string; "@_href"?: string } | undefined;

function text(node: Node): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  return node?.["#text"] ?? "";
}

/** Normalise whitespace and strip any stray tags from a title. */
export function cleanTitle(raw: string): string {
  return raw.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Only http(s) links, with tracking parameters removed. Returns null for
 * anything else (e.g. `javascript:` URLs from a malicious feed).
 */
export function canonicalUrl(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|at_|CMP$|cmpid$|ref$|ns_)/i.test(key)) url.searchParams.delete(key);
    }
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

/** Small, stable, non-cryptographic hash for ids (FNV-1a). */
export function hashId(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

function toIso(raw: string): string | null {
  if (!raw) return null;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

interface RawItem {
  title?: Node;
  link?: Node | Node[];
  pubDate?: string;
  "dc:date"?: string;
  updated?: string;
  published?: string;
}

export function parseFeed(xml: string, feed: { id: string; name: string }): Headline[] {
  const doc = parser.parse(xml) as {
    rss?: { channel?: { item?: RawItem | RawItem[] } };
    feed?: { entry?: RawItem | RawItem[] };
  };
  const rawItems = doc.rss?.channel?.item ?? doc.feed?.entry ?? [];
  const items = Array.isArray(rawItems) ? rawItems : [rawItems];

  const out: Headline[] = [];
  for (const item of items) {
    const title = cleanTitle(text(item.title));
    // RSS: <link>url</link>; Atom: <link href="url"/> (possibly several).
    const links = Array.isArray(item.link) ? item.link : [item.link];
    const rawLink = links.map((l) => (typeof l === "object" && l?.["@_href"]) || text(l)).find(Boolean) ?? "";
    const url = canonicalUrl(rawLink);
    if (!title || !url) continue;
    out.push({
      id: hashId(url),
      title,
      url,
      feedId: feed.id,
      source: feed.name,
      publishedAt: toIso(item.pubDate ?? item["dc:date"] ?? item.published ?? item.updated ?? ""),
    });
  }
  return out;
}

/** Merge feeds: drop duplicate URLs, newest first, undated items last. */
export function mergeHeadlines(lists: Headline[][]): Headline[] {
  const seen = new Set<string>();
  const merged: Headline[] = [];
  for (const h of lists.flat()) {
    if (seen.has(h.url)) continue;
    seen.add(h.url);
    merged.push(h);
  }
  return merged.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
}
