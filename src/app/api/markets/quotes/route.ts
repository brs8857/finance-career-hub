import type { NextRequest } from "next/server";
import { isValidSymbol } from "@/lib/markets/instruments";
import { getQuotes } from "@/lib/markets/service";

// GET /api/markets/quotes?symbols=^FTSE,GBPUSD=X,UK10Y

const MAX_SYMBOLS = 60;

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("symbols") ?? "";
  const symbols = [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))];

  if (symbols.length === 0) return Response.json({ error: "Pass ?symbols=A,B,C" }, { status: 400 });
  if (symbols.length > MAX_SYMBOLS) {
    return Response.json({ error: `At most ${MAX_SYMBOLS} symbols per request` }, { status: 400 });
  }
  const invalid = symbols.filter((s) => !isValidSymbol(s));
  if (invalid.length > 0) {
    return Response.json({ error: `Invalid symbol(s): ${invalid.join(", ")}` }, { status: 400 });
  }

  return Response.json(await getQuotes(symbols));
}
