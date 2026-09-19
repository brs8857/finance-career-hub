import { getNews } from "@/lib/news/service";

// GET /api/news -> merged headlines (title + link + date only) and per-feed status.

export async function GET() {
  return Response.json(await getNews());
}
