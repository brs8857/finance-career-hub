// Shared news types (server + client).

export interface Headline {
  /** Stable id derived from the canonical URL. */
  id: string;
  title: string;
  /** Publisher URL (http/https only). */
  url: string;
  feedId: string;
  source: string;
  /** ISO time, or null if the feed didn't give one. */
  publishedAt: string | null;
}

export interface FeedStatus {
  id: string;
  name: string;
  homepage: string;
  note?: string;
  status: "ok" | "stale" | "error";
  fetchedAt: string | null;
  count: number;
  error?: string;
}

export interface NewsResponse {
  headlines: Headline[];
  feeds: FeedStatus[];
}
