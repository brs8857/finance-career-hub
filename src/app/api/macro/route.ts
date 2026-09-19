import { getMacro } from "@/lib/macro/service";

// GET /api/macro -> UK and US indicators plus yield curves, with provenance.

export async function GET() {
  return Response.json(await getMacro());
}
