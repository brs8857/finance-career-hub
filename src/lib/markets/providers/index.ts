import "server-only";

import { marketProviderName } from "@/lib/env";
import type { MarketProvider } from "./provider";
import { twelveDataProvider } from "./twelvedata";
import { yahooProvider } from "./yahoo";

/** The provider chosen by MARKET_DATA_PROVIDER, or null for sample mode. */
export function activeProvider(): MarketProvider | null {
  switch (marketProviderName()) {
    case "twelvedata":
      return twelveDataProvider;
    case "sample":
      return null;
    default:
      return yahooProvider;
  }
}
