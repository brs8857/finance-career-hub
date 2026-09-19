import "server-only";

import { readKey } from "@/lib/env";
import { createThrottle } from "@/lib/throttle";

// FRED API (Federal Reserve Bank of St. Louis). Free key required:
// https://fred.stlouisfed.org/docs/api/api_key.html
//
// Response: { observations: [{ date: "2026-08-01", value: "4.3" }] }.
// Missing values are the string ".". Errors: { error_code, error_message }.

const BASE = "https://api.stlouisfed.org/fred/series/observations";
const throttle = createThrottle(300);

export interface FredPoint {
  date: string;
  value: number;
}

export class MissingFredKeyError extends Error {
  constructor() {
    super("FRED_API_KEY is not set");
  }
}

export function hasFredKey(): boolean {
  return readKey("FRED_API_KEY") !== null;
}

export function parseFredObservations(raw: { observations?: Array<{ date: string; value: string }> }): FredPoint[] {
  const points: FredPoint[] = [];
  for (const row of raw.observations ?? []) {
    if (row.value === "." || row.value.trim() === "") continue;
    const value = Number(row.value);
    if (Number.isFinite(value)) points.push({ date: row.date, value });
  }
  return points;
}

/**
 * @param units FRED transformation, e.g. "lin" (levels) or "pc1" (% change from a year ago).
 */
export async function fetchFredSeries(
  seriesId: string,
  options: { start: string; units?: "lin" | "pc1" | "pch" },
): Promise<FredPoint[]> {
  const key = readKey("FRED_API_KEY");
  if (!key) throw new MissingFredKeyError();
  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: key,
    file_type: "json",
    observation_start: options.start,
    units: options.units ?? "lin",
  });
  const raw = await throttle(async () => {
    const res = await fetch(`${BASE}?${params}`, { cache: "no-store" });
    const body = (await res.json()) as { error_message?: string; observations?: Array<{ date: string; value: string }> };
    if (!res.ok || body.error_message) {
      // Never echo the URL: it contains the key.
      throw new Error(`FRED: ${body.error_message ?? `HTTP ${res.status}`}`);
    }
    return body;
  });
  const points = parseFredObservations(raw);
  if (points.length === 0) throw new Error(`FRED returned no data for ${seriesId}`);
  return points;
}

export function fredSeriesUrl(seriesId: string): string {
  return `https://fred.stlouisfed.org/series/${seriesId}`;
}
