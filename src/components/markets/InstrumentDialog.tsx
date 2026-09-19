"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { DataStatus } from "@/components/ui/DataStatus";
import { Delta } from "@/components/ui/Delta";
import { formatDate, formatDateTime, formatPrice } from "@/lib/format";
import type { Instrument, QuoteResult } from "@/lib/markets/types";
import { MyTakeNotes } from "./MyTakeNotes";
import { PriceChart } from "./PriceChart";

/** Detail view: chart with range tabs, key stats and "My take" notes. */
export function InstrumentDialog({
  instrument,
  result,
  onClose,
}: {
  instrument: Instrument | null;
  result: QuoteResult | undefined;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (instrument && !dialog.open) dialog.showModal();
    if (!instrument && dialog.open) dialog.close();
  }, [instrument]);

  const quote = result?.quote;
  const currency = quote?.currency ?? instrument?.currency ?? null;
  const headingId = "instrument-dialog-title";

  return (
    <dialog
      ref={ref}
      aria-labelledby={headingId}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className="m-auto w-[min(56rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] rounded-xl border border-border bg-surface p-0 text-fg shadow-xl"
    >
      {instrument ? (
        <div className="p-4 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id={headingId} className="text-xl font-semibold">
                {instrument.name}
              </h2>
              <p className="text-xs text-muted">
                {instrument.symbol}
                {instrument.detail ? ` · ${instrument.detail}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="rounded-md p-2 text-muted hover:bg-surface-2 hover:text-fg"
              aria-label="Close"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>

          {quote && result ? (
            <div className="mt-3">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <p className="num text-3xl font-semibold">{formatPrice(quote.price, instrument.kind, currency)}</p>
                <Delta change={quote.change} changePct={quote.changePct} kind={instrument.kind} currency={currency} />
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:flex sm:flex-wrap">
                <div className="flex gap-1">
                  <dt className="text-muted">{instrument.kind === "yield" ? "Previous obs." : "Prev. close"}</dt>
                  <dd className="num">{formatPrice(quote.previousClose, instrument.kind, currency)}</dd>
                </div>
                {quote.asOf ? (
                  <div className="flex gap-1">
                    <dt className="text-muted">As of</dt>
                    <dd>{instrument.kind === "yield" ? formatDate(quote.asOf) : formatDateTime(quote.asOf)}</dd>
                  </div>
                ) : null}
              </dl>
              <DataStatus provenance={result} className="mt-2" />
            </div>
          ) : null}

          <div className="mt-5">
            <PriceChart instrument={instrument} currency={currency} />
          </div>

          <hr className="my-5 border-border" />

          <MyTakeNotes instrument={instrument} result={result} currency={currency} />
        </div>
      ) : null}
    </dialog>
  );
}
