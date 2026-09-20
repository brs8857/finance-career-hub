import type { NextRequest } from "next/server";
import { IS_DEMO } from "@/lib/demo";
import { isCollectionName } from "@/lib/store/collections";
import { readCollection, ValidationError, writeCollection } from "@/lib/store/server";

// GET  /api/store/<collection>  -> { value }
// PUT  /api/store/<collection>  body { value } -> { value }

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/store/[collection]">) {
  const { collection } = await ctx.params;
  if (!isCollectionName(collection)) {
    return Response.json({ error: `Unknown collection "${collection}"` }, { status: 404 });
  }
  try {
    return Response.json({ value: await readCollection(collection) });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: RouteContext<"/api/store/[collection]">) {
  const { collection } = await ctx.params;
  if (!isCollectionName(collection)) {
    return Response.json({ error: `Unknown collection "${collection}"` }, { status: 404 });
  }
  // Backstop for the public demo: the browser doesn't send saves, and the
  // server has no writable disk there anyway.
  if (IS_DEMO) {
    return Response.json({ error: "This is a read-only demo - changes aren't saved." }, { status: 403 });
  }
  let body: { value?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Body must be JSON" }, { status: 400 });
  }
  try {
    return Response.json({ value: await writeCollection(collection, body.value) });
  } catch (error) {
    const status = error instanceof ValidationError ? 400 : 500;
    return Response.json({ error: (error as Error).message }, { status });
  }
}
