import "server-only";

import { cached } from "@/lib/cache";
import { createThrottle } from "@/lib/throttle";
import { FEEDS, type FeedDefinition } from "./feeds";
import { mergeHeadlines, parseFeed } from "./rss";
import type { FeedStatus, Headline, NewsResponse } from "./types";

// Fetches every feed (cached 30 minutes each), merges and de-duplicates.
// One slow or broken feed never blocks the others.

const TTL = 30 * 60;
const MAX_BYTES = 2_000_000; // guard against a runaway response
const MAX_HEADLINES = 150;
const throttle = createThrottle(250);

async function fetchFeed(feed: FeedDefinition): Promise<Headline[]> {
  const xml = await throttle(async () => {
    const res = await fetch(feed.url, {
      cache: "no-store",
      headers: { "User-Agent": "finance-career-hub (personal learning project)" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.text();
    if (body.length > MAX_BYTES) throw new Error("feed too large");
    return body;
  });
  const headlines = parseFeed(xml, feed);
  if (headlines.length === 0) throw new Error("no headlines found");
  return headlines;
}

export async function getNews(): Promise<NewsResponse> {
  const lists: Headline[][] = [];
  const feeds: FeedStatus[] = [];

  for (const feed of FEEDS) {
    const base = { id: feed.id, name: feed.name, homepage: feed.homepage, note: feed.note };
    try {
      const { value, storedAt, stale } = await cached(`news:${feed.id}`, TTL, () => fetchFeed(feed));
      lists.push(value);
      feeds.push({
        ...base,
        status: stale ? "stale" : "ok",
        fetchedAt: new Date(storedAt).toISOString(),
        count: value.length,
      });
    } catch (error) {
      feeds.push({ ...base, status: "error", fetchedAt: null, count: 0, error: (error as Error).message });
    }
  }

  return { headlines: mergeHeadlines(lists).slice(0, MAX_HEADLINES), feeds };
}
