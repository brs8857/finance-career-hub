"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { EXPLAINERS } from "@/lib/macro/explainers";
import type { IndicatorId, MacroResponse } from "@/lib/macro/types";
import { Explainer } from "./Explainer";
import { IndicatorCard } from "./IndicatorCard";
import { YieldCurveChart } from "./YieldCurveChart";

const ORDER: IndicatorId[] = ["policy-rate", "cpi", "gdp", "unemployment"];

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: MacroResponse };

export function MacroDashboard() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/macro", { cache: "no-store" })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
        if (!cancelled) setState({ status: "ready", data: body as MacroResponse });
      })
      .catch((error: Error) => {
        if (!cancelled) setState({ status: "error", message: error.message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "error") {
    return (
      <p role="alert" className="text-sm text-down">
        Couldn&apos;t load macro data: {state.message}
      </p>
    );
  }

  const data = state.status === "ready" ? state.data : null;

  return (
    <div className="space-y-10">
      {ORDER.map((id) => {
        const explainer = EXPLAINERS[id];
        const results = data?.indicators.filter((i) => i.id === id) ?? [];
        return (
          <section key={id} aria-labelledby={`sec-${id}`} className="space-y-3">
            <h2 id={`sec-${id}`} className="text-lg font-semibold">
              {explainer.title}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {data
                ? results.map((r) => <IndicatorCard key={`${r.country}-${r.id}`} result={r} />)
                : ["UK", "US"].map((c) => (
                    <div key={c} aria-hidden className="h-72 animate-pulse rounded-lg border border-border bg-surface" />
                  ))}
            </div>
            <Explainer content={explainer} />
          </section>
        );
      })}

      <section aria-labelledby="sec-curve" className="space-y-3">
        <h2 id="sec-curve" className="text-lg font-semibold">
          {EXPLAINERS["yield-curve"].title}
        </h2>
        <Card>
          <CardHeader
            title="Government bond yields by maturity"
            description="Latest available day for each country. The x-axis is spaced by maturity, so short dates are stretched."
          />
          {data ? (
            <YieldCurveChart curves={data.curves} />
          ) : (
            <div aria-hidden className="h-72 animate-pulse rounded bg-surface-2" />
          )}
        </Card>
        <Explainer content={EXPLAINERS["yield-curve"]} />
      </section>
    </div>
  );
}
