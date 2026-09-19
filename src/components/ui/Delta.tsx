import { formatChange, formatPct } from "@/lib/format";
import type { InstrumentKind } from "@/lib/markets/types";

export function directionOf(value: number | null | undefined): "up" | "down" | "flat" {
  if (value == null || !Number.isFinite(value) || value === 0) return "flat";
  return value > 0 ? "up" : "down";
}

const COLOURS = { up: "text-up", down: "text-down", flat: "text-muted" } as const;
const GLYPHS = { up: "▲", down: "▼", flat: "■" } as const;
const WORDS = { up: "up", down: "down", flat: "unchanged" } as const;

/**
 * Price change with colour AND a glyph AND screen-reader text, so direction
 * never relies on colour alone.
 */
export function Delta({
  change,
  changePct,
  kind,
  currency,
  showAbsolute = true,
  className = "",
}: {
  change: number | null;
  changePct: number | null;
  kind: InstrumentKind;
  currency?: string | null;
  showAbsolute?: boolean;
  className?: string;
}) {
  const dir = directionOf(changePct ?? change);
  const hasPct = changePct != null && Number.isFinite(changePct);
  return (
    <span className={`num inline-flex items-center gap-1 ${COLOURS[dir]} ${className}`}>
      <span aria-hidden className="text-[0.7em]">
        {GLYPHS[dir]}
      </span>
      <span className="sr-only">{WORDS[dir]}</span>
      {showAbsolute ? <span>{formatChange(change, kind, currency)}</span> : null}
      {/* Yield % changes are misleading; basis points say it all. */}
      {hasPct && kind !== "yield" ? <span>{showAbsolute ? `(${formatPct(changePct)})` : formatPct(changePct)}</span> : null}
      {!hasPct && !showAbsolute ? <span>—</span> : null}
    </span>
  );
}
