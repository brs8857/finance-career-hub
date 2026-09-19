import type { NextRequest } from "next/server";
import { isValidSymbol } from "@/lib/markets/instruments";
import { lookupSymbol } from "@/lib/markets/service";

// GET /api/markets/lookup?symbol=VOD.L
// Checks a ticker exists before it's added to the watchlist.

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get("symbol") ?? "").trim().toUpperCase();
  if (!isValidSymbol(symbol)) {
    return Response.json({ status: "invalid", message: "That doesn't look like a ticker." }, { status: 400 });
  }
  const result = await lookupSymbol(symbol);
  const status = result.status === "found" ? 200 : result.status === "not_found" ? 404 : 503;
  return Response.json(result, { status });
}
