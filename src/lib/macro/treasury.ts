import { createThrottle } from "@/lib/throttle";
import type { CurvePoint } from "./types";

// US Treasury daily par yield curve. Keyless CSV from home.treasury.gov.
// Header (checked 2026-09-19):
//   Date,"1 Mo","1.5 Month","2 Mo","3 Mo","4 Mo","6 Mo","1 Yr","2 Yr","3 Yr","5 Yr","7 Yr","10 Yr","20 Yr","30 Yr"
//   09/18/2026,3.97,3.98,4.10,...
// Rows are newest first. Blank cells happen (e.g. a tenor not yet issued).

const throttle = createThrottle(500);

export const TREASURY_PAGE =
  "https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve";

function csvUrl(year: number): string {
  return `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/${year}/all?type=daily_treasury_yield_curve&field_tdr_date_value=${year}&page&_format=csv`;
}

/** "1 Mo" -> 1/12, "1.5 Month" -> 0.125, "2 Yr" -> 2. null for anything unrecognised. */
export function tenorYears(header: string): number | null {
  const match = /^([\d.]+)\s*(Mo|Month|Months|Yr|Year|Years)$/i.exec(header.replace(/"/g, "").trim());
  if (!match) return null;
  const n = Number(match[1]);
  return /^y/i.test(match[2]) ? n : n / 12;
}

function tenorLabel(years: number): string {
  if (years < 1) return `${Math.round(years * 12 * 10) / 10}M`;
  return `${years}Y`;
}

/** Parse the CSV and return the most recent curve. */
export function parseTreasuryCsv(csv: string): { date: string; points: CurvePoint[] } | null {
  const lines = csv.trim().split(/\r?\n/);
  const header = lines.shift()?.split(",") ?? [];
  if (!/date/i.test(header[0] ?? "")) throw new Error("US Treasury: unexpected CSV format");
  const tenors = header.slice(1).map(tenorYears);

  let latest: { date: string; points: CurvePoint[] } | null = null;
  for (const line of lines) {
    const cells = line.split(",");
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(cells[0]?.trim() ?? "");
    if (!m) continue;
    const date = `${m[3]}-${m[1]}-${m[2]}`;
    if (latest && date <= latest.date) continue;
    const points: CurvePoint[] = [];
    tenors.forEach((years, i) => {
      const raw = cells[i + 1]?.trim();
      const value = raw ? Number(raw) : NaN;
      if (years != null && Number.isFinite(value)) points.push({ years, label: tenorLabel(years), value });
    });
    if (points.length > 0) latest = { date, points };
  }
  return latest;
}

async function fetchYear(year: number): Promise<string> {
  return throttle(async () => {
    const res = await fetch(csvUrl(year), {
      cache: "no-store",
      headers: { "User-Agent": "finance-career-hub (personal learning project)" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`US Treasury HTTP ${res.status}`);
    return res.text();
  });
}

/** Latest US curve. Early in January the current year may be empty, so fall back a year. */
export async function fetchLatestUsCurve(now = new Date()): Promise<{ date: string; points: CurvePoint[] }> {
  const year = now.getUTCFullYear();
  const curve = parseTreasuryCsv(await fetchYear(year)) ?? parseTreasuryCsv(await fetchYear(year - 1));
  if (!curve) throw new Error("US Treasury returned no yield curve data");
  return curve;
}
