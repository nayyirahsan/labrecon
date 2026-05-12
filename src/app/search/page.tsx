export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import { db } from "@/lib/db";
import { withTimeout } from "@/lib/db/query";
import { researchers } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { SearchClient } from "./search-client";

async function fetchDepartments(): Promise<string[]> {
  try {
    const rows = await withTimeout(
      db
        .selectDistinct({ department: researchers.department })
        .from(researchers)
        .where(sql`${researchers.department} IS NOT NULL`),
      8000,
      []
    );
    return rows.map((r) => r.department as string).sort((a, b) => a.localeCompare(b));
  } catch (e) {
    console.error('DB query failed:', e);
    return [];
  }
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
