import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";

function metric(help: string, name: string, type: string, value: number): string {
  return `# HELP ${name} ${help}\n# TYPE ${name} ${type}\n${name} ${value}`;
}

export async function GET() {
  const [
    researchersTotal,
    researchersWithEmbeddings,
    emailGenerationsTotal,
    activeUsers7d,
    publicationsTotal,
  ] = await Promise.all([
    db.execute(sql`SELECT COUNT(*) FROM researchers`),
    db.execute(sql`SELECT COUNT(*) FROM researchers WHERE embedding IS NOT NULL`),
    db.execute(sql`SELECT COUNT(*) FROM email_generations`),
    db.execute(
      sql`SELECT COUNT(DISTINCT user_id) FROM email_generations WHERE generated_at > now() - interval '7 days'`
    ),
    db.execute(sql`SELECT COUNT(*) FROM publications`),
  ]);

  const rows = {
    researchers: Number((researchersTotal as unknown as { rows: { count: string }[] }).rows[0]?.count ?? 0),
    withEmbeddings: Number((researchersWithEmbeddings as unknown as { rows: { count: string }[] }).rows[0]?.count ?? 0),
    emailGenerations: Number((emailGenerationsTotal as unknown as { rows: { count: string }[] }).rows[0]?.count ?? 0),
    activeUsers: Number((activeUsers7d as unknown as { rows: { count: string }[] }).rows[0]?.count ?? 0),
    publications: Number((publicationsTotal as unknown as { rows: { count: string }[] }).rows[0]?.count ?? 0),
  };

  const lines = [
    metric("Total indexed researchers", "labrecon_researchers_total", "gauge", rows.researchers),
    metric("Researchers with embeddings", "labrecon_researchers_with_embeddings", "gauge", rows.withEmbeddings),
    metric("Total publications indexed", "labrecon_publications_total", "gauge", rows.publications),
    metric("Total email generations", "labrecon_email_generations_total", "counter", rows.emailGenerations),
    metric("Active users in last 7 days", "labrecon_active_users_7d", "gauge", rows.activeUsers),
  ].join("\n");

  return new Response(lines + "\n", {
    headers: { "Content-Type": "text/plain; version=0.0.4" },
  });
}
