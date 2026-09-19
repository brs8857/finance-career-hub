import type { Metadata } from "next";
import { MarketsDashboard } from "@/components/markets/MarketsDashboard";
import { PageHeader } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Markets" };

export default function MarketsPage() {
  return (
    <>
      <PageHeader
        title="Markets"
        description="UK-first snapshot of indices, currencies, commodities and gilts, plus your watchlist. Click anything for a chart and to record your take on why it moved."
      />
      <MarketsDashboard />
    </>
  );
}
