import "server-only";

import { cached } from "@/lib/cache";
import { fetchBoeSeries } from "./boe";
import { fetchFredSeries, fredSeriesUrl, hasFredKey, MissingFredKeyError } from "./fred";
import { fetchFreshestOnsSeries, fetchOnsSeries, onsUrl } from "./ons";
import { lastChange, monthLabel, monthlyFromDaily, quarterLabel, since } from "./series";
import { fetchLatestUsCurve, TREASURY_PAGE } from "./treasury";
import type {
  Country,
  CurvePoint,
  CurveResult,
  IndicatorData,
  IndicatorId,
  IndicatorResult,
  MacroResponse,
  Observation,
} from "./types";
import type { DataSource } from "@/lib/markets/types";

// Builds the macro panel: UK from the ONS and Bank of England (keyless), US
// from FRED (free key) and the US Treasury (keyless). Every series is cached
// for 12 hours - these are monthly/quarterly releases. A failed refresh serves
// the last good copy flagged stale; with no copy, the card says why it's
// unavailable. Macro cards never show invented numbers.

const TTL = 12 * 60 * 60;
const HISTORY_START = "2019-01-01"; // pre-Covid baseline, then the 2022 inflation spike

function yearsAgo(n: number): Date {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - n);
  return d;
}

interface Definition {
  id: IndicatorId;
  country: Country;
  source: DataSource;
  load: () => Promise<IndicatorData>;
}

const ONS_CPI_TOPIC = "economy/inflationandpriceindices";
const ONS_GDP_TOPIC = "economy/grossdomesticproductgdp";
const ONS_LMS_TOPIC = "employmentandlabourmarket/peoplenotinwork/unemployment";

const DEFINITIONS: Definition[] = [
  {
    id: "policy-rate",
    country: "UK",
    source: "boe",
    async load() {
      const series = (await fetchBoeSeries(["IUDBEDR"], yearsAgo(8))).IUDBEDR ?? [];
      if (series.length === 0) throw new Error("Bank of England returned no Bank Rate data");
      return {
        observations: since(monthlyFromDaily(series), HISTORY_START),
        lastChange: lastChange(series),
        sourceUrl: "https://www.bankofengland.co.uk/monetary-policy/the-interest-rate-bank-rate",
        seriesName: "Bank of England IUDBEDR",
      };
    },
  },
  {
    id: "cpi",
    country: "UK",
    source: "ons",
    async load() {
      const s = await fetchOnsSeries(ONS_CPI_TOPIC, "D7G7", "MM23", "months");
      return {
        observations: since(s.observations, HISTORY_START),
        releaseDate: s.releaseDate,
        nextRelease: s.nextRelease,
        sourceUrl: onsUrl(ONS_CPI_TOPIC, "D7G7", "MM23"),
        seriesName: "ONS D7G7 (CPI annual rate)",
      };
    },
  },
  {
    id: "gdp",
    country: "UK",
    source: "ons",
    async load() {
      // PN2 = first quarterly estimate; QNA = later, revised. Use whichever is newer.
      const qoq = await fetchFreshestOnsSeries(ONS_GDP_TOPIC, "IHYQ", ["PN2", "QNA"], "quarters");
      const yoy = await fetchFreshestOnsSeries(ONS_GDP_TOPIC, "IHYR", ["PN2", "QNA"], "quarters");
      const yoyLatest = yoy.observations.at(-1);
      return {
        observations: since(qoq.observations, HISTORY_START),
        secondary: yoyLatest ? { label: "On a year earlier", latest: yoyLatest } : null,
        releaseDate: qoq.releaseDate,
        nextRelease: qoq.nextRelease,
        sourceUrl: onsUrl(ONS_GDP_TOPIC, "IHYQ", qoq.dataset),
        seriesName: `ONS IHYQ / IHYR (${qoq.dataset})`,
      };
    },
  },
  {
    id: "unemployment",
    country: "UK",
    source: "ons",
    async load() {
      const s = await fetchOnsSeries(ONS_LMS_TOPIC, "MGSX", "LMS", "months");
      // LFS figures are rolling three-month averages labelled by the final month.
      const observations = since(s.observations, HISTORY_START).map((o) => ({
        ...o,
        label: `3 months to ${o.label}`,
      }));
      return {
        observations,
        releaseDate: s.releaseDate,
        nextRelease: s.nextRelease,
        sourceUrl: onsUrl(ONS_LMS_TOPIC, "MGSX", "LMS"),
        seriesName: "ONS MGSX (LFS, 16+, SA)",
      };
    },
  },
  {
    id: "policy-rate",
    country: "US",
    source: "fred",
    async load() {
      const start = yearsAgo(8).toISOString().slice(0, 10);
      const upper = await fetchFredSeries("DFEDTARU", { start });
      const lower = await fetchFredSeries("DFEDTARL", { start });
      const lo = lower.at(-1)!.value;
      const hi = upper.at(-1)!.value;
      return {
        observations: since(monthlyFromDaily(upper), HISTORY_START),
        display: `${lo.toFixed(2)}–${hi.toFixed(2)}%`,
        lastChange: lastChange(upper),
        sourceUrl: fredSeriesUrl("DFEDTARU"),
        seriesName: "FRED DFEDTARL / DFEDTARU (target range)",
      };
    },
  },
  {
    id: "cpi",
    country: "US",
    source: "fred",
    async load() {
      const points = await fetchFredSeries("CPIAUCSL", { start: HISTORY_START, units: "pc1" });
      return {
        observations: points.map((p) => ({ date: p.date, label: monthLabel(p.date), value: p.value })),
        sourceUrl: fredSeriesUrl("CPIAUCSL"),
        seriesName: "FRED CPIAUCSL (% change on a year earlier)",
      };
    },
  },
  {
    id: "gdp",
    country: "US",
    source: "fred",
    async load() {
      const annualised = await fetchFredSeries("A191RL1Q225SBEA", { start: HISTORY_START });
      const yoy = await fetchFredSeries("A191RO1Q156NBEA", { start: HISTORY_START });
      const toObs = (p: { date: string; value: number }): Observation => ({
        date: p.date,
        label: quarterLabel(p.date),
        value: p.value,
      });
      const yoyLatest = yoy.at(-1);
      return {
        observations: annualised.map(toObs),
        secondary: yoyLatest ? { label: "On a year earlier", latest: toObs(yoyLatest) } : null,
        sourceUrl: fredSeriesUrl("A191RL1Q225SBEA"),
        seriesName: "FRED A191RL1Q225SBEA (annualised q/q)",
      };
    },
  },
  {
    id: "unemployment",
    country: "US",
    source: "fred",
    async load() {
      const points = await fetchFredSeries("UNRATE", { start: HISTORY_START });
      return {
        observations: points.map((p) => ({ date: p.date, label: monthLabel(p.date), value: p.value })),
        sourceUrl: fredSeriesUrl("UNRATE"),
        seriesName: "FRED UNRATE (U-3)",
      };
    },
  },
];

const FRED_FIX = "Add a free FRED_API_KEY to .env.local, then restart npm run dev. See README section 2.";

async function loadIndicator(def: Definition): Promise<IndicatorResult> {
  const base = { id: def.id, country: def.country };
  if (def.source === "fred" && !hasFredKey()) {
    return { ...base, status: "unavailable", reason: "US data needs a free FRED API key.", fix: FRED_FIX };
  }
  try {
    const { value, storedAt, stale } = await cached(`macro:${def.country}:${def.id}`, TTL, def.load);
    return {
      ...base,
      status: "ok",
      source: def.source,
      fetchedAt: new Date(storedAt).toISOString(),
      isSample: false,
      stale,
      note: stale ? "Couldn't refresh; showing the last data we fetched." : undefined,
      data: value,
    };
  } catch (error) {
    if (error instanceof MissingFredKeyError) {
      return { ...base, status: "unavailable", reason: "US data needs a free FRED API key.", fix: FRED_FIX };
    }
    return { ...base, status: "unavailable", reason: `Couldn't load this data: ${(error as Error).message}` };
  }
}

// ---------- Yield curves ----------

const UK_CURVE_SERIES: Array<{ code: string; years: number; label: string }> = [
  { code: "IUDSOIA", years: 1 / 365, label: "O/N" },
  { code: "IUDSNPY", years: 5, label: "5Y" },
  { code: "IUDMNPY", years: 10, label: "10Y" },
  { code: "IUDLNPY", years: 20, label: "20Y" },
];

/** Latest date on which every UK series has a value. */
export function latestCommonUkCurve(
  data: Record<string, Array<{ date: string; value: number }>>,
): { date: string; points: CurvePoint[] } | null {
  const maps = UK_CURVE_SERIES.map((s) => new Map((data[s.code] ?? []).map((d) => [d.date, d.value])));
  const dates = [...maps[0].keys()].sort().reverse();
  for (const date of dates) {
    if (maps.every((m) => m.has(date))) {
      return { date, points: UK_CURVE_SERIES.map((s, i) => ({ years: s.years, label: s.label, value: maps[i].get(date)! })) };
    }
  }
  return null;
}

async function ukCurve(): Promise<CurveResult> {
  try {
    const { value, storedAt, stale } = await cached("macro:UK:curve", TTL, async () => {
      const from = new Date(Date.now() - 30 * 24 * 3_600_000);
      const curve = latestCommonUkCurve(await fetchBoeSeries(UK_CURVE_SERIES.map((s) => s.code), from));
      if (!curve) throw new Error("Bank of England returned no complete curve in the last 30 days");
      return curve;
    });
    return {
      status: "ok",
      country: "UK",
      date: value.date,
      points: value.points,
      sourceUrl: "https://www.bankofengland.co.uk/statistics/yield-curves",
      note: "Short end is SONIA (overnight rate); other points are nominal par gilt yields.",
      source: "boe",
      fetchedAt: new Date(storedAt).toISOString(),
      isSample: false,
      stale,
    };
  } catch (error) {
    return { status: "unavailable", country: "UK", reason: (error as Error).message };
  }
}

async function usCurve(): Promise<CurveResult> {
  try {
    const { value, storedAt, stale } = await cached("macro:US:curve", 6 * 60 * 60, () => fetchLatestUsCurve());
    return {
      status: "ok",
      country: "US",
      date: value.date,
      points: value.points,
      sourceUrl: TREASURY_PAGE,
      source: "treasury",
      fetchedAt: new Date(storedAt).toISOString(),
      isSample: false,
      stale,
    };
  } catch (error) {
    return { status: "unavailable", country: "US", reason: (error as Error).message };
  }
}

export async function getMacro(): Promise<MacroResponse> {
  // Sequential on purpose: each source has its own throttle, and this runs at
  // most every 12 hours per series thanks to the cache.
  const indicators: IndicatorResult[] = [];
  for (const def of DEFINITIONS) indicators.push(await loadIndicator(def));
  const curves = [await ukCurve(), await usCurve()];
  return { indicators, curves };
}

