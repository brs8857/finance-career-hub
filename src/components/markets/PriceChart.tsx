"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DataStatus } from "@/components/ui/DataStatus";
import { Delta } from "@/components/ui/Delta";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { formatDateTime, formatPrice } from "@/lib/format";
import { CHART_RANGES, type ChartRange, type HistoryResponse, type Instrument } from "@/lib/markets/types";

const TZ = "Europe/London";

function tickFormatter(range: ChartRange) {
  const opts: Intl.DateTimeFormatOptions =
    range === "1D"
      ? { hour: "2-digit", minute: "2-digit" }
      : range === "1W"
        ? { weekday: "short", day: "numeric" }
        : range === "1M"
          ? { day: "numeric", month: "short" }
          : { month: "short", year: "2-digit" };
  const fmt = new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: TZ });
  return (t: number) => fmt.format(t);
}

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: HistoryResponse };

export function PriceChart({ instrument, currency }: { instrument: Instrument; currency: string | null }) {
  const ranges = instrument.ranges ?? CHART_RANGES;
  const [range, setRange] = useState<ChartRange>(ranges.includes("1M") ? "1M" : ranges[0]);
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- show the loading state for the new range
    setState({ status: "loading" });
    fetch(`/api/markets/history?symbol=${encodeURIComponent(instrument.symbol)}&range=${range}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
        setState({ status: "ready", data: body as HistoryResponse });
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") setState({ status: "error", message: error.message });
      });
    return () => controller.abort();
  }, [instrument.symbol, range]);

  const points = state.status === "ready" ? state.data.points : [];
  const first = points[0]?.v;
  const last = points.at(-1)?.v;
  const periodChange = first != null && last != null ? last - first : null;
  const periodPct = first && periodChange != null ? (periodChange / first) * 100 : null;
  const fmtTick = tickFormatter(range);
  const fmtValue = (v: number) => formatPrice(v, instrument.kind, currency);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <SegmentedControl label="Chart range" options={CHART_RANGES} value={range} onChange={setRange} disabled={CHART_RANGES.filter((r) => !ranges.includes(r))} />
        {periodChange != null ? (
          <p className="text-xs text-muted">
            {/* Measured from the first point on the chart, so for 1D that's the
                open - not yesterday's close, which the headline change uses. */}
            {range === "1D" ? "Since the open" : `Over ${range}`}:{" "}
            <Delta change={periodChange} changePct={periodPct} kind={instrument.kind} currency={currency} className="text-xs" />
          </p>
        ) : null}
      </div>

      <div className="h-64 w-full">
        {state.status === "loading" ? (
          <div aria-label="Loading chart" className="h-full w-full animate-pulse rounded bg-surface-2" />
        ) : state.status === "error" ? (
          <p className="grid h-full place-items-center text-sm text-down">Couldn&apos;t load the chart: {state.message}</p>
        ) : points.length < 2 ? (
          <p className="grid h-full place-items-center text-sm text-muted">No data points for this range yet.</p>
        ) : (
          <figure
            role="img"
            aria-label={`${instrument.name}, ${range}: from ${fmtValue(first!)} to ${fmtValue(last!)}.`}
            className="h-full w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="price-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-line)" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="var(--chart-line)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                <XAxis
                  dataKey="t"
                  type="number"
                  scale="time"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={fmtTick}
                  tick={{ fill: "var(--muted)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={32}
                />
                <YAxis
                  dataKey="v"
                  domain={["auto", "auto"]}
                  tickFormatter={fmtValue}
                  tick={{ fill: "var(--muted)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={72}
                />
                <Tooltip
                  cursor={{ stroke: "var(--muted)", strokeDasharray: "3 3" }}
                  content={({ active, payload }) => {
                    const p = payload?.[0]?.payload as { t: number; v: number } | undefined;
                    if (!active || !p) return null;
                    return (
                      <div className="rounded-md border border-border bg-surface px-2 py-1 text-xs shadow">
                        <p className="text-muted">{formatDateTime(p.t)}</p>
                        <p className="num font-semibold text-fg">{fmtValue(p.v)}</p>
                      </div>
                    );
                  }}
                />
                <Area
                  type="linear"
                  dataKey="v"
                  stroke="var(--chart-line)"
                  strokeWidth={2}
                  fill="url(#price-fill)"
                  isAnimationActive={false}
                  activeDot={{ r: 4, stroke: "var(--surface)", strokeWidth: 2, fill: "var(--chart-line)" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </figure>
        )}
      </div>

      {state.status === "ready" ? (
        <>
          <DataStatus provenance={state.data} className="mt-2" />
          {points.length > 0 ? (
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer text-muted hover:text-fg">Show data table</summary>
              <div className="mt-2 max-h-56 overflow-auto rounded border border-border">
                <table className="w-full text-left">
                  <caption className="sr-only">
                    {instrument.name} {range} prices
                  </caption>
                  <thead className="sticky top-0 bg-surface-2">
                    <tr>
                      <th scope="col" className="px-2 py-1 font-medium">Time (UK)</th>
                      <th scope="col" className="px-2 py-1 text-right font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...points].reverse().map((p) => (
                      <tr key={p.t} className="border-t border-border">
                        <td className="px-2 py-1">{formatDateTime(p.t)}</td>
                        <td className="num px-2 py-1 text-right">{fmtValue(p.v)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
