import { db } from "@/lib/db";
import { researchers, publications } from "@/lib/db/schema";
import { sql, desc, inArray } from "drizzle-orm";
import { generateQueryEmbedding } from "@/lib/embeddings";

export const runtime = "nodejs";

type ResearcherRow = typeof researchers.$inferSelect & {
  semantic_score?: number;
  keyword_score?: number;
  combined_score?: number;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const department = url.searchParams.get("department")?.trim() ?? "";
  const rawLimit = Number(url.searchParams.get("limit") ?? "20");
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50) : 20;

  const start = Date.now();
  const search_type = q ? "semantic" : "listing";

  let rows: ResearcherRow[];

  if (!q) {
    let query = db.select().from(researchers).orderBy(desc(researchers.last_updated_at)).$dynamic();
    if (department) {
      query = query.where(sql`${researchers.department} = ${department}`);
    }
    rows = (await query.limit(limit)) as ResearcherRow[];
  } else {
    const embedding = await generateQueryEmbedding(q);
    const embeddingStr = `[${embedding.join(",")}]`;

    const deptClause = department
      ? sql`AND r.department = ${department}`
      : sql``;

    const result = await db.execute(sql`
      SELECT r.*,
        (1 - (r.embedding <=> ${embeddingStr}::vector)) as semantic_score,
        similarity(
          r.name || ' ' || coalesce(r.department, '') || ' ' || coalesce(r.research_summary, ''),
          ${q}
        ) as keyword_score,
        (
          0.7 * (1 - (r.embedding <=> ${embeddingStr}::vector)) +
          0.3 * similarity(
            r.name || ' ' || coalesce(r.department, '') || ' ' || coalesce(r.research_summary, ''),
            ${q}
          )
        ) as combined_score
      FROM researchers r
      WHERE r.embedding IS NOT NULL
      ${deptClause}
      ORDER BY combined_score DESC
      LIMIT ${limit}
    `);

    rows = result as unknown as ResearcherRow[];
  }

  // Fetch top 3 publications per researcher
  const ids = rows.map((r) => r.id).filter(Boolean);
  const allPubs =
    ids.length > 0
      ? await db
          .select()
          .from(publications)
          .where(inArray(publications.researcher_id, ids))
          .orderBy(desc(publications.cited_by_count))
      : [];

  const pubsByResearcher = new Map<string, (typeof allPubs)[number][]>();
  for (const pub of allPubs) {
    if (!pub.researcher_id) continue;
    const bucket = pubsByResearcher.get(pub.researcher_id) ?? [];
    bucket.push(pub);
    pubsByResearcher.set(pub.researcher_id, bucket);
  }

  const results = rows.map((r) => ({
    ...r,
    pubs: (pubsByResearcher.get(r.id) ?? []).slice(0, 3),
  }));

  const duration_ms = Date.now() - start;

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      query: q,
      result_count: results.length,
      duration_ms,
      search_type,
    })
  );

  return Response.json(
    { results, meta: { count: results.length, duration_ms, search_type, query: q } },
    {
      headers: {
        "X-Search-Duration": String(duration_ms),
        "X-Search-Type": search_type,
      },
    }
  );
}
