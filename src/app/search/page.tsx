import { Suspense } from "react";
import { db } from "@/lib/db";
import { researchers } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { SearchClient } from "./search-client";

async function fetchDepartments(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ department: researchers.department })
    .from(researchers)
    .where(sql`${researchers.department} IS NOT NULL`);
  return rows.map((r) => r.department as string).sort((a, b) => a.localeCompare(b));
}

type SearchParams = { q?: string; department?: string };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const departments = await fetchDepartments();

  return (
    <Suspense>
      <SearchClient
        departments={departments}
        initialQuery={params.q ?? ""}
        initialDept={params.department ?? ""}
      />
    </Suspense>
  );
}
