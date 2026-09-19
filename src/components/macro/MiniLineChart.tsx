"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Observation } from "@/lib/macro/types";

/**
 * Compact single-series history chart with hover tooltip. Optional reference
 * line (e.g. the 2% inflation target); a zero line is added automatically when
 * the series crosses zero (e.g. GDP growth).
 */
export function MiniLineChart({
  observations,
  format,
  label,
  reference,
  height = 128,
}: {
  observations: Observation[];
  format: (v: number) => string;
  label: string;
  reference?: { value: number; label: string };
  height?: number;
}) {
  if (observations.length < 2) return null;
  const data = observations.map((o) => ({ t: Date.parse(`${o.date}T00:00:00Z`), v: o.value, label: o.label }));
  const values = data.map((d) => d.v);
  const crossesZero = Math.min(...values) < 0 && Math.max(...values) > 0;
  const first = observations[0];
  const last = observations.at(-1)!;
  const yearFmt = new Intl.DateTimeFormat("en-GB", { year: "numeric", timeZone: "UTC" });

  return (
    <figure
      role="img"
      aria-label={`${label}: ${format(first.value)} in ${first.label}, ${format(last.value)} in ${last.label}.`}
      style={{ height }}
      className="w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(t: number) => yearFmt.format(t)}
            tick={{ fill: "var(--muted)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            minTickGap={28}
          />
          <YAxis
            dataKey="v"
            domain={["auto", "auto"]}
            tickFormatter={format}
            tick={{ fill: "var(--muted)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={44}
            tickCount={4}
          />
          {crossesZero ? <ReferenceLine y={0} stroke="var(--muted)" strokeOpacity={0.6} /> : null}
          {reference ? (
            <ReferenceLine
              y={reference.value}
              stroke="var(--muted)"
              strokeDasharray="4 3"
              label={{ value: reference.label, position: "insideTopRight", fill: "var(--muted)", fontSize: 10 }}
            />
          ) : null}
          <Tooltip
            cursor={{ stroke: "var(--muted)", strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              const p = payload?.[0]?.payload as { v: number; label: string } | undefined;
              if (!active || !p) return null;
              return (
                <div className="rounded-md border border-border bg-surface px-2 py-1 text-xs shadow">
                  <p className="text-muted">{p.label}</p>
                  <p className="num font-semibold text-fg">{format(p.v)}</p>
                </div>
              );
            }}
          />
          <Line
            type="linear"
            dataKey="v"
            stroke="var(--chart-line)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            activeDot={{ r: 4, stroke: "var(--surface)", strokeWidth: 2, fill: "var(--chart-line)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </figure>
  );
}
