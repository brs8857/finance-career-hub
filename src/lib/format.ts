// Number and date formatting helpers. Safe to use on server and client.
// Everything is pinned to en-GB and Europe/London so the server and the
// browser always produce identical text (no hydration mismatches).

import type { InstrumentKind } from "@/lib/markets/types";

const LOCALE = "en-GB";
const TIME_ZONE = "Europe/London";
const MINUS = "−"; // proper minus sign, reads as "minus" in screen readers

function fixed(value: number, decimals: number): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** Decimal places that suit each kind of instrument. */
export function decimalsFor(kind: InstrumentKind): number {
  if (kind === "fx") return 4;
  if (kind === "yield") return 3;
  return 2;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: "£",
  USD: "$",
  EUR: "€",
  JPY: "¥",
};

/**
 * Format a price the way a UK finance reader expects:
 * - index levels: plain number, no currency (the FTSE 100 is in points, not pounds)
 * - FX rates: 4 dp, no currency symbol
 * - yields: "5.242%"
 * - LSE shares quoted in pence ("GBp"): "126.15p"
 * - everything else: currency symbol + number
 */
export function formatPrice(
  value: number | null | undefined,
  kind: InstrumentKind,
  currency?: string | null,
): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const dp = decimalsFor(kind);
  if (kind === "index" || kind === "fx") return fixed(value, dp);
  if (kind === "yield") return `${fixed(value, dp)}%`;
  if (currency === "GBp") return `${fixed(value, dp)}p`;
  const symbol = currency ? CURRENCY_SYMBOLS[currency] : undefined;
  if (symbol) return `${symbol}${fixed(value, dp)}`;
  return currency ? `${fixed(value, dp)} ${currency}` : fixed(value, dp);
}

function signed(text: string, value: number): string {
  if (value > 0) return `+${text}`;
  if (value < 0) return `${MINUS}${text}`;
  return text;
}

/** "+0.26%" / "−0.28%" */
export function formatPct(value: number | null | undefined, decimals = 2): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return signed(`${fixed(Math.abs(value), decimals)}%`, value);
}

/** Absolute change. Yields move in basis points (1bp = 0.01 percentage points). */
export function formatChange(
  value: number | null | undefined,
  kind: InstrumentKind,
  currency?: string | null,
): string {
  if (value == null || !Number.isFinite(value)) return "—";
  if (kind === "yield") return signed(`${fixed(Math.abs(value) * 100, 1)}bp`, value);
  const dp = decimalsFor(kind);
  const text = fixed(Math.abs(value), dp);
  return signed(currency === "GBp" && kind !== "index" ? `${text}p` : text, value);
}

export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return fixed(value, decimals);
}

/** "19 Sep 2026, 12:34" in UK time. */
export function formatDateTime(iso: string | number | Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(new Date(iso));
}

/** "16 Sep 2026" */
export function formatDate(iso: string | number | Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(new Date(iso));
}

/** "12:34" in UK time. */
export function formatTime(iso: string | number | Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(new Date(iso));
}

/** "just now", "4 min ago", "3 h ago", "2 days ago" */
export function formatRelative(iso: string | number | Date, now: number = Date.now()): string {
  const seconds = Math.round((now - new Date(iso).getTime()) / 1000);
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 36) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

/** Today's date in UK time as YYYY-MM-DD (for notes, streaks, goals). */
export function todayIsoDate(now: Date = new Date()): string {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now);
}

/** Percentage-point change, e.g. "+0.2pp" / "−0.25pp". Used for rates and macro data. */
export function formatPp(value: number | null | undefined, decimals = 1): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return signed(`${fixed(Math.abs(value), decimals)}pp`, value);
}

/** "5.24%" */
export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value < 0 ? MINUS : ""}${fixed(Math.abs(value), decimals)}%`;
}

/** "Today" / "Yesterday" / "Thu 17 Sep" for grouping a feed by UK calendar day. */
export function dayGroupLabel(iso: string, now: Date = new Date()): string {
  const day = todayIsoDate(new Date(iso));
  const today = todayIsoDate(now);
  const yesterday = todayIsoDate(new Date(now.getTime() - 24 * 3_600_000));
  if (day === today) return "Today";
  if (day === yesterday) return "Yesterday";
  return new Intl.DateTimeFormat(LOCALE, { weekday: "short", day: "numeric", month: "short", timeZone: TIME_ZONE }).format(
    new Date(iso),
  );
}
