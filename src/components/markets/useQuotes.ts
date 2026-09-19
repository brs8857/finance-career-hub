"use client";

import { useCallback, useEffect, useState } from "react";
import type { QuotesResponse } from "@/lib/markets/types";

const REFRESH_MS = 5 * 60_000;

async function requestQuotes(key: string): Promise<QuotesResponse> {
  const res = await fetch(`/api/markets/quotes?symbols=${encodeURIComponent(key)}`, { cache: "no-store" });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
  return body as QuotesResponse;
}

/**
 * Fetch quotes for a list of symbols from our own API (never from Yahoo
 * directly - keys and rate limiting live on the server). Refreshes every
 * 5 minutes while the tab is visible; the server cache means this can't
 * exceed upstream limits. An empty list means "not ready yet".
 */
export function useQuotes(symbols: string[]) {
  const key = symbols.join(",");
  const [data, setData] = useState<QuotesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0); // bump to refetch

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    requestQuotes(key)
      .then((body) => {
        if (cancelled) return;
        setData(body);
        setError(null);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [key, tick]);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") setTick((t) => t + 1);
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    setTick((t) => t + 1);
  }, []);

  return { data, error, loading, refresh };
}
