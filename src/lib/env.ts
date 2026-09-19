import "server-only";

// Reads configuration from environment variables (.env.local).
// Server-only: importing this from a client component is a build error.

const PLACEHOLDER = /^your_.*_here$/i;

/** Returns the key, or null if it's missing or still the .env.example placeholder. */
export function readKey(name: string): string | null {
  const value = process.env[name]?.trim();
  if (!value || PLACEHOLDER.test(value)) return null;
  return value;
}

export type MarketProviderName = "yahoo" | "twelvedata" | "sample";

export function marketProviderName(): MarketProviderName {
  const value = process.env.MARKET_DATA_PROVIDER?.trim().toLowerCase();
  if (value === "twelvedata" || value === "sample") return value;
  return "yahoo";
}
