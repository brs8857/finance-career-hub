"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DataStatus } from "@/components/ui/DataStatus";
import { formatDate, formatPercent } from "@/lib/format";
import type { CurvePoint, CurveResult } from "@/lib/macro/types";

type OkCurve = Extract<CurveResult, { status: "ok" }>;

const SERIES = {
  UK: { name: "UK gilts", colour: "var(--chart-line)" },
  US: { name: "US Treasuries", colour: "var(--chart-2)" },
} as const;

const TICKS = [0.25, 1, 2, 5, 10, 20, 30];

function tickLabel(years: number): string {
  return years < 1 ? `${Math.round(years * 12)}M` : `${years}Y`;
}

function valueAt(curve: OkCurve, years: number): number | undefined {
  return curve.points.find((p) => Math.abs(p.years - years) < 1e-6)?.value;
}

/** Slope in basis points between two maturities, or null if either is missing. */
export function slopeBp(points: CurvePoint[], longYears: number, shortYears: number): number | null {
  const long = points.find((p) => Math.abs(p.years - longYears) < 1e-6)?.value;
  const short = points.find((p) => Math.abs(p.years - shortYears) < 1e-6)?.value;
  return long != null && short != null ? Math.round((long - short) * 100) : null;
}

function Slope({ label, bp }: { label: string; bp: number | null }) {
  if (bp == null) return null;
  const shape = bp > 0 ? "upward sloping" : bp < 0 ? "inverted" : "flat";
  return (
    <li className="flex justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className="num">
        {bp > 0 ? "+" : bp < 0 ? "−" : ""}
        {Math.abs(bp)}bp <span className="text-muted">({shape})</span>
      </span>
    </li>
  );
}

export function YieldCurveChart({ curves }: { curves: CurveResult[] }) {
  const ok = curves.filter((c): c is OkCurve => c.status === "ok");
  const missing = curves.filter((c) => c.status === "unavailable");
  const uk = ok.find((c) => c.country === "UK");
  const us = ok.find((c) => c.country === "US");
  const allValues = ok.flatMap((c) => c.points.map((p) => p.value));

  return (
    <div className="space-y-3">
      {/* Legend: always present for two series; direct labels sit on the lines too. */}
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs" aria-label="Legend">
        {ok.map((c) => (
          <li key={c.country} className="flex items-center gap-2">
            <span aria-hidden className="inline-block h-0.5 w-5 rounded" style={{ background: SERIES[c.country].colour }} />
            <span className="text-fg">{SERIES[c.country].name}</span>
            <span className="text-muted">as of {formatDate(c.date)}</span>
          </li>
        ))}
      </ul>

      {ok.length > 0 ? (
        <figure
          role="img"
          aria-label={ok
            .map((c) => `${SERIES[c.country].name}: ${c.points.map((p) => `${p.label} ${formatPercent(p.value, 2)}`).join(", ")}`)
            .join(". ")}
          className="h-72 w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart margin={{ top: 10, right: 64, bottom: 4, left: 0 }}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="years"
                type="number"
                scale="sqrt"
                domain={[0, 30]}
                ticks={TICKS}
                tickFormatter={tickLabel}
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDuplicatedCategory={false}
              />
              <YAxis
                dataKey="value"
                domain={[Math.floor(Math.min(...allValues) * 4) / 4 - 0.25, Math.ceil(Math.max(...allValues) * 4) / 4 + 0.25]}
                tickFormatter={(v: number) => formatPercent(v, 2)}
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip
                cursor={{ stroke: "var(--muted)", strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as CurvePoint;
                  return (
                    <div className="rounded-md border border-border bg-surface px-2 py-1 text-xs shadow">
                      <p className="text-muted">{p.label === "O/N" ? "Overnight (SONIA)" : `${p.label} maturity`}</p>
                      {payload.map((entry) => (
                        <p key={String(entry.name)} className="num text-fg">
                          {entry.name}: <strong>{formatPercent(Number(entry.value), 2)}</strong>
                        </p>
                      ))}
                    </div>
                  );
                }}
              />
              {ok.map((c) => (
                <Line
                  key={c.country}
                  data={c.points}
                  dataKey="value"
                  name={SERIES[c.country].name}
                  type="linear"
                  stroke={SERIES[c.country].colour}
                  strokeWidth={2}
                  isAnimationActive={false}
                  dot={{ r: 3, fill: SERIES[c.country].colour, stroke: "var(--surface)", strokeWidth: 2 }}
                  activeDot={{ r: 5, stroke: "var(--surface)", strokeWidth: 2 }}
                  label={(props: { x?: number | string; y?: number | string; index?: number }) =>
                    props.index === c.points.length - 1 ? (
                      <text
                        key={`label-${c.country}`}
                        x={Number(props.x) + 8}
                        y={Number(props.y)}
                        dy={4}
                        fontSize={11}
                        fill="var(--fg)"
                      >
                        {c.country}
                      </text>
                    ) : (
                      <g key={`nolabel-${c.country}-${props.index}`} />
                    )
                  }
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </figure>
      ) : null}

      {missing.map((c) => (
        <p key={c.country} role="alert" className="text-xs text-down">
          {c.country} curve unavailable: {c.status === "unavailable" ? c.reason : ""}
        </p>
      ))}

      <div className="grid gap-4 text-xs sm:grid-cols-2">
        {uk ? (
          <div>
            <ul className="space-y-0.5">
              <Slope label="UK 10Y minus overnight" bp={slopeBp(uk.points, 10, 1 / 365)} />
              <Slope label="UK 20Y minus 5Y" bp={slopeBp(uk.points, 20, 5)} />
            </ul>
            <DataStatus provenance={uk} className="mt-1" />
            {uk.note ? <p className="mt-1 text-muted">{uk.note}</p> : null}
          </div>
        ) : null}
        {us ? (
          <div>
            <ul className="space-y-0.5">
              <Slope label="US 10Y minus 2Y" bp={slopeBp(us.points, 10, 2)} />
              <Slope label="US 10Y minus 3M" bp={slopeBp(us.points, 10, 0.25)} />
            </ul>
            <DataStatus provenance={us} className="mt-1" />
          </div>
        ) : null}
      </div>

      {ok.length > 0 ? (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted hover:text-fg">Show data table</summary>
          <table className="mt-2 w-full max-w-md">
            <caption className="sr-only">Yield by maturity</caption>
            <thead>
              <tr className="text-left text-muted">
                <th scope="col" className="py-1 font-medium">Maturity</th>
                {ok.map((c) => (
                  <th key={c.country} scope="col" className="py-1 text-right font-medium">
                    {c.country}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...new Set(ok.flatMap((c) => c.points.map((p) => p.years)))]
                .sort((a, b) => a - b)
                .map((years) => (
                  <tr key={years} className="border-t border-border">
                    <td className="py-0.5">{years < 0.01 ? "Overnight" : tickLabel(years).replace(/^(\d+)M$/, (_, m) => `${m} months`)}</td>
                    {ok.map((c) => {
                      const v = valueAt(c, years);
                      return (
                        <td key={c.country} className="num py-0.5 text-right">
                          {v != null ? formatPercent(v, 2) : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
            </tbody>
          </table>
        </details>
      ) : null}
    </div>
  );
}
