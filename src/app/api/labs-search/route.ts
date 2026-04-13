import { db } from "@/lib/db";
import { labs } from "@/lib/db/schema";
import { like, or } from "drizzle-orm";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const rawLimit = Number.parseInt(url.searchParams.get("limit") ?? "6", 10);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), 20)
    : 6;

  if (!q) return Response.json({ labs: [] });

  const term = `%${q}%`;
  const results = db
    .select({
      id: labs.id,
      piName: labs.piName,
      labName: labs.labName,
      department: labs.department,
    })
    .from(labs)
    .where(
      or(
        like(labs.piName, term),
        like(labs.labName, term),
        like(labs.department, term),
        like(labs.researchSummary, term)
      )
    )
    .limit(limit)
    .all();

  return Response.json({ labs: results });
}
