// Shared macro types. No Node-only imports: used by server and client.

import type { Provenance } from "@/lib/markets/types";

export type Country = "UK" | "US";
export type IndicatorId = "policy-rate" | "cpi" | "gdp" | "unemployment";

export interface Observation {
  /** ISO date for the START of the period (e.g. "2026-08-01" for Aug 2026). */
  date: string;
  /** Display label for the period, e.g. "Aug 2026", "Q2 2026", "3 months to Jun 2026". */
  label: string;
  value: number;
}

export interface IndicatorData {
  /** Headline series (oldest first). */
  observations: Observation[];
  /** Optional second measure shown under the headline (e.g. GDP year-on-year). */
  secondary?: { label: string; latest: Observation } | null;
  /** Custom headline text, e.g. a Fed target range "3.50–3.75%". */
  display?: string;
  /** For policy rates: the last time the rate changed. */
  lastChange?: { date: string; from: number; to: number } | null;
  releaseDate?: string | null;
  nextRelease?: string | null;
  /** Link to the official page for this series. */
  sourceUrl: string;
  /** Short name of the exact series, e.g. "ONS D7G7". */
  seriesName: string;
}

export type IndicatorResult =
  | ({ status: "ok"; id: IndicatorId; country: Country } & Provenance & { data: IndicatorData })
  | { status: "unavailable"; id: IndicatorId; country: Country; reason: string; fix?: string };

export interface CurvePoint {
  /** Maturity in years (overnight ≈ 1/365). */
  years: number;
  label: string;
  value: number;
}

export type CurveResult =
  | ({ status: "ok"; country: Country; date: string; points: CurvePoint[]; sourceUrl: string; note?: string } & Provenance)
  | { status: "unavailable"; country: Country; reason: string };

export interface MacroResponse {
  indicators: IndicatorResult[];
  curves: CurveResult[];
}
