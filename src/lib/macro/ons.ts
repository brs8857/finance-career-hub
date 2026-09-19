import { createThrottle } from "@/lib/throttle";
import type { Observation } from "./types";

// ONS time series JSON. Keyless.
// URL pattern: https://www.ons.gov.uk/<topic path>/timeseries/<cdid>/<dataset>/data
//
// Response facts (checked 2026-09-19):
// - description.{title, unit, releaseDate, nextRelease}
// - months: [{ date: "2026 AUG", value: "3.1" }], quarters: [{ date: "2026 Q2" }], years: [...]
// - The same series can live in several datasets; e.g. GDP growth IHYQ was
//   more recent in PN2 (first estimate, Q2 2026) than QNA (Q1 2026).

const throttle = createThrottle(500);

const MONTHS: Record<string, string> = {
  JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06",
  JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12",
};
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export type OnsFrequency = "months" | "quarters";

interface OnsRaw {
  description?: { title?: string; unit?: string; releaseDate?: string; nextRelease?: string };
  months?: Array<{ date: string; value: string }>;
  quarters?: Array<{ date: string; value: string }>;
}

export interface OnsSeries {
  title: string;
  releaseDate: string | null;
  nextRelease: string | null;
  observations: Observation[];
}

/** "2026 AUG" -> {date: "2026-08-01", label: "Aug 2026"}; "2026 Q2" -> {date: "2026-04-01", label: "Q2 2026"} */
export function parseOnsPeriod(text: string): { date: string; label: string } | null {
  const month = /^(\d{4}) ([A-Z]{3})$/.exec(text.trim());
  if (month && MONTHS[month[2]]) {
    const m = MONTHS[month[2]];
    return { date: `${month[1]}-${m}-01`, label: `${MONTH_NAMES[Number(m) - 1]} ${month[1]}` };
  }
  const quarter = /^(\d{4}) Q([1-4])$/.exec(text.trim());
  if (quarter) {
    const startMonth = String((Number(quarter[2]) - 1) * 3 + 1).padStart(2, "0");
    return { date: `${quarter[1]}-${startMonth}-01`, label: `Q${quarter[2]} ${quarter[1]}` };
  }
  return null;
}

export function parseOnsSeries(raw: OnsRaw, frequency: OnsFrequency): OnsSeries {
  const rows = raw[frequency] ?? [];
  const observations: Observation[] = [];
  for (const row of rows) {
    const period = parseOnsPeriod(row.date);
    const value = Number(row.value);
    // ONS uses blank strings for missing values; Number("") is 0, so check explicitly.
    if (period && row.value.trim() !== "" && Number.isFinite(value)) {
      observations.push({ ...period, value });
    }
  }
  observations.sort((a, b) => a.date.localeCompare(b.date));
  return {
    title: raw.description?.title ?? "",
    releaseDate: raw.description?.releaseDate ?? null,
    nextRelease: raw.description?.nextRelease ?? null,
    observations,
  };
}

export function onsUrl(topicPath: string, cdid: string, dataset: string): string {
  return `https://www.ons.gov.uk/${topicPath}/timeseries/${cdid.toLowerCase()}/${dataset.toLowerCase()}`;
}

export async function fetchOnsSeries(
  topicPath: string,
  cdid: string,
  dataset: string,
  frequency: OnsFrequency,
): Promise<OnsSeries> {
  const raw = await throttle(async () => {
    const res = await fetch(`${onsUrl(topicPath, cdid, dataset)}/data`, {
      cache: "no-store",
      headers: { "User-Agent": "finance-career-hub (personal learning project)" },
    });
    if (!res.ok) throw new Error(`ONS HTTP ${res.status} for ${cdid}/${dataset}`);
    return (await res.json()) as OnsRaw;
  });
  const series = parseOnsSeries(raw, frequency);
  if (series.observations.length === 0) throw new Error(`ONS returned no ${frequency} data for ${cdid}`);
  return series;
}

/**
 * Fetch the same series from several datasets and keep the one with the most
 * recent observation (ties go to the later release).
 */
export async function fetchFreshestOnsSeries(
  topicPath: string,
  cdid: string,
  datasets: string[],
  frequency: OnsFrequency,
): Promise<OnsSeries & { dataset: string }> {
  const results: Array<OnsSeries & { dataset: string }> = [];
  const errors: string[] = [];
  for (const dataset of datasets) {
    try {
      results.push({ ...(await fetchOnsSeries(topicPath, cdid, dataset, frequency)), dataset });
    } catch (error) {
      errors.push((error as Error).message);
    }
  }
  if (results.length === 0) throw new Error(errors.join("; "));
  return pickFreshest(results);
}

export function pickFreshest<T extends OnsSeries>(candidates: T[]): T {
  return candidates.reduce((best, next) => {
    const a = best.observations.at(-1)?.date ?? "";
    const b = next.observations.at(-1)?.date ?? "";
    if (b !== a) return b > a ? next : best;
    return (next.releaseDate ?? "") > (best.releaseDate ?? "") ? next : best;
  });
}
