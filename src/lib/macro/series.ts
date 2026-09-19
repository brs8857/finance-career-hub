// Pure helpers for turning raw series into chart-ready observations.
// No network, no Node-only imports - easy to unit test.

import type { DatedValue } from "./boe";
import type { Observation } from "./types";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function monthLabel(isoDate: string): string {
  return `${MONTH_NAMES[Number(isoDate.slice(5, 7)) - 1]} ${isoDate.slice(0, 4)}`;
}

export function quarterLabel(isoDate: string): string {
  return `Q${Math.floor((Number(isoDate.slice(5, 7)) - 1) / 3) + 1} ${isoDate.slice(0, 4)}`;
}

export function dayLabel(isoDate: string): string {
  return `${Number(isoDate.slice(8, 10))} ${monthLabel(isoDate)}`;
}

/**
 * Daily series -> one point per month (the month's last value), with the very
 * latest daily value as the final point so the headline is current.
 */
export function monthlyFromDaily(series: DatedValue[]): Observation[] {
  const byMonth = new Map<string, DatedValue>();
  for (const d of series) byMonth.set(d.date.slice(0, 7), d);
  const points = [...byMonth.values()].map((d) => ({
    date: `${d.date.slice(0, 7)}-01`,
    label: monthLabel(d.date),
    value: d.value,
  }));
  const last = series.at(-1);
  if (last && points.length > 0) points[points.length - 1] = { date: last.date, label: dayLabel(last.date), value: last.value };
  return points;
}

/** The most recent date the value changed, e.g. a Bank Rate decision. */
export function lastChange(series: DatedValue[]): { date: string; from: number; to: number } | null {
  for (let i = series.length - 1; i > 0; i--) {
    if (series[i].value !== series[i - 1].value) {
      return { date: series[i].date, from: series[i - 1].value, to: series[i].value };
    }
  }
  return null;
}

/** Keep observations on or after `start` (YYYY-MM-DD). */
export function since(observations: Observation[], start: string): Observation[] {
  return observations.filter((o) => o.date >= start);
}
