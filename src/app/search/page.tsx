import { eq } from "drizzle-orm";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { labs, publications } from "@/lib/db/schema";
import type { LabWithPubs } from "@/lib/search";
import { SearchClient } from "./search-client";

// Fetch all labs joined with their publications.
// better-sqlite3 is synchronous so no await needed.
function fetchLabsWithPubs(): LabWithPubs[] {
  const allLabs = db.select().from(labs).all();
  const allPubs = db.select().from(publications).all();

  const pubsByLabId = new Map<number, typeof allPubs>();
  for (const pub of allPubs) {
    const bucket = pubsByLabId.get(pub.labId) ?? [];
    bucket.push(pub);
    pubsByLabId.set(pub.labId, bucket);
  }

  return allLabs.map((lab) => ({
    ...lab,
    pubs: pubsByLabId.get(lab.id) ?? [],
  }));
}

type SearchParams = { q?: string; dept?: string; skills?: string; activity?: string };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const allLabs = fetchLabsWithPubs();

  // Unique departments — preserving insertion order from allLabs
  const departments = [...new Set(allLabs.map((l) => l.department))];

  // Unique skills — flattened, sorted alphabetically
  const allSkills = [
    ...new Set(
      allLabs.flatMap((l) => JSON.parse(l.skills) as string[])
    ),
  ].sort((a, b) => a.localeCompare(b));

  return (
    <Suspense>
      <SearchClient
        allLabs={allLabs}
        departments={departments}
        allSkills={allSkills}
        initialQuery={params.q ?? ""}
      />
    </Suspense>
  );
}
