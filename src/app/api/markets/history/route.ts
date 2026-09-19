import type { NextRequest } from "next/server";
import { isValidSymbol } from "@/lib/markets/instruments";
import { getHistory } from "@/lib/markets/service";
import { CHART_RANGES, type ChartRange } from "@/lib/markets/types";

// GET /api/markets/history?symbol=^FTSE&range=1M

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") ?? "";
  const range = (req.nextUrl.searchParams.get("range") ?? "1M") as ChartRange;

  if (!isValidSymbol(symbol)) return Response.json({ error: "Invalid symbol" }, { status: 400 });
  if (!CHART_RANGES.includes(range)) {
    return Response.json({ error: `range must be one of ${CHART_RANGES.join(", ")}` }, { status: 400 });
  }

  return Response.json(await getHistory(symbol, range));
}
