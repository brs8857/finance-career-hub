"use client";

import { ExternalLink, KeyRound } from "lucide-react";
import { DataStatus } from "@/components/ui/DataStatus";
import { directionOf } from "@/components/ui/Delta";
import { formatDate, formatPercent, formatPp } from "@/lib/format";
import type { IndicatorResult } from "@/lib/macro/types";
import { MiniLineChart } from "./MiniLineChart";

const HEADLINE_LABEL: Record<string, string> = {
  "UK:policy-rate": "Bank Rate",
  "US:policy-rate": "Fed funds target range",
  "UK:cpi": "CPI, 12-month rate",
  "US:cpi": "CPI-U, on a year earlier",
  "UK:gdp": "Real GDP, on previous quarter",
  "US:gdp": "Real GDP, annualised q/q",
  "UK:unemployment": "ILO unemployment rate, 16+",
  "US:unemployment": "Unemployment rate (U-3)",
};

/** Macro changes are neutral facts, so use a glyph + muted text, not red/green. */
function ChangeText({ value, versus, decimals }: { value: number; versus: string; decimals: number }) {
  // Compare at the published precision so float noise never shows as a change.
  const rounded = Number(value.toFixed(decimals));
  const dir = directionOf(rounded);
  const glyph = dir === "up" ? "▲" : dir === "down" ? "▼" : "■";
  return (
    <span className="num">
      <span aria-hidden className="text-[0.7em]">
        {glyph}
      </span>{" "}
      {dir === "flat" ? "Unchanged" : formatPp(rounded, decimals)} vs {versus}
    </span>
  );
}

export function IndicatorCard({ result }: { result: IndicatorResult }) {
  const key = `${result.country}:${result.id}`;
  const headingId = `ind-${result.country}-${result.id}`;

  if (result.status === "unavailable") {
    return (
      <article aria-labelledby={headingId} className="flex flex-col gap-2 rounded-lg border border-dashed border-border bg-surface p-4">
        <h3 id={headingId} className="text-sm font-medium">
          {result.country} · <span className="text-muted">{HEADLINE_LABEL[key]}</span>
        </h3>
        <p className="flex items-start gap-2 text-sm text-muted">
          <KeyRound aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            {result.reason}
            {result.fix ? <span className="mt-1 block text-xs">{result.fix}</span> : null}
          </span>
        </p>
      </article>
    );
  }

  const { data } = result;
  const obs = data.observations;
  const latest = obs.at(-1)!;
  const previous = obs.at(-2);
  const isRate = result.id === "policy-rate";
  const format = (v: number) => formatPercent(v, isRate ? 2 : 1);

  return (
    <article aria-labelledby={headingId} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <div>
        <h3 id={headingId} className="text-sm font-medium">
          {result.country} · <span className="text-muted">{HEADLINE_LABEL[key]}</span>
        </h3>
        <p className="num mt-1 text-2xl font-semibold">{data.display ?? format(latest.value)}</p>
        <p className="text-xs text-muted">
          {isRate ? `As of ${latest.label}` : latest.label}
          {data.secondary ? (
            <>
              {" · "}
              {data.secondary.label}: <span className="num text-fg">{format(data.secondary.latest.value)}</span>
            </>
          ) : null}
        </p>
        <p className="mt-1 text-xs text-muted">
          {isRate && data.lastChange ? (
            <>
              Last change: {data.lastChange.to < data.lastChange.from ? "cut" : "raised"}{" "}
              <span className="num">{formatPp(Math.abs(data.lastChange.to - data.lastChange.from), 2).replace("+", "")}</span>, from{" "}
              <span className="num">{format(data.lastChange.from)}</span> to <span className="num">{format(data.lastChange.to)}</span>, on{" "}
              {formatDate(data.lastChange.date)}
            </>
          ) : !isRate && previous ? (
            <ChangeText value={latest.value - previous.value} versus={previous.label} decimals={1} />
          ) : null}
        </p>
      </div>

      <MiniLineChart
        observations={obs}
        format={format}
        label={`${result.country} ${HEADLINE_LABEL[key]} since ${obs[0].label}`}
        reference={key === "UK:cpi" ? { value: 2, label: "2% target" } : undefined}
      />

      <div className="mt-auto space-y-1 text-xs text-muted">
        {data.releaseDate || data.nextRelease ? (
          <p>
            {data.releaseDate ? <>Released {formatDate(data.releaseDate)}</> : null}
            {data.releaseDate && data.nextRelease ? " · " : null}
            {data.nextRelease ? <>Next release {data.nextRelease}</> : null}
          </p>
        ) : null}
        <DataStatus provenance={result} />
        <a
          href={data.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-accent hover:underline"
        >
          {data.seriesName}
          <ExternalLink aria-hidden className="size-3" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
        <details>
          <summary className="cursor-pointer hover:text-fg">Show recent data</summary>
          <table className="mt-1 w-full">
            <caption className="sr-only">{HEADLINE_LABEL[key]}, most recent observations</caption>
            <tbody>
              {obs
                .slice(-12)
                .reverse()
                .map((o) => (
                  <tr key={o.date} className="border-t border-border">
                    <td className="py-0.5">{o.label}</td>
                    <td className="num py-0.5 text-right text-fg">{format(o.value)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </details>
      </div>
    </article>
  );
}
