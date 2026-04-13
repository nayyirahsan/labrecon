import type { Lab, Publication } from "@/lib/db/schema";

export type LabWithPubs = Lab & { pubs: Publication[] };

export type ActivityFilter = "all" | "active" | "moderate";

export type MatchReason = {
  field: "pi_name" | "lab_name" | "skills" | "department" | "research_summary" | "publications";
  detail?: string;
};

// Escape regex special chars
function esc(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Count non-overlapping occurrences of `term` in `text`
function countMatches(text: string, term: string): number {
  return (text.match(new RegExp(esc(term), "gi")) ?? []).length;
}

export function scoreLabWithReasons(
  lab: LabWithPubs,
  query: string
): { score: number; reasons: MatchReason[] } {
  if (!query.trim()) return { score: lab.activityScore, reasons: [] };

  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1);
  if (!terms.length) return { score: lab.activityScore, reasons: [] };

  const skills = JSON.parse(lab.skills) as string[];
  let score = 0;
  const matchedFields = new Set<MatchReason["field"]>();
  const matchedSkills: string[] = [];

  for (const term of terms) {
    const pi = lab.piName.toLowerCase();
    const ln = lab.labName.toLowerCase();
    const rs = lab.researchSummary.toLowerCase();
    const dept = lab.department.toLowerCase();

    // PI name — highest signal
    if (pi === term) { score += 140; matchedFields.add("pi_name"); }
    else if (pi.startsWith(term)) { score += 90; matchedFields.add("pi_name"); }
    else if (pi.includes(term)) { score += 55; matchedFields.add("pi_name"); }

    // Lab name
    if (ln.includes(term)) { score += 45; matchedFields.add("lab_name"); }

    // Department / college
    if (dept.includes(term)) { score += 25; matchedFields.add("department"); }
    if (lab.college.toLowerCase().includes(term)) score += 15;

    // Research summary — frequency weighted
    const rsMatches = countMatches(rs, term);
    if (rsMatches > 0) { score += rsMatches * 20; matchedFields.add("research_summary"); }

    // Skills — strong signal
    for (const skill of skills) {
      if (skill.toLowerCase().includes(term)) {
        score += 65;
        matchedFields.add("skills");
        if (!matchedSkills.includes(skill)) matchedSkills.push(skill);
      }
    }

    // Publications — title beats abstract
    let pubMatch = false;
    for (const pub of lab.pubs) {
      const pubMatches = countMatches(pub.title.toLowerCase(), term);
      if (pubMatches > 0) { score += pubMatches * 18; pubMatch = true; }
      if (pub.abstract) {
        const absMatches = countMatches(pub.abstract.toLowerCase(), term);
        if (absMatches > 0) { score += absMatches * 5; pubMatch = true; }
      }
    }
    if (pubMatch) matchedFields.add("publications");
  }

  // Build reasons list (ordered by signal strength)
  const reasons: MatchReason[] = [];
  const orderedFields: MatchReason["field"][] = [
    "pi_name", "skills", "lab_name", "publications", "department", "research_summary",
  ];
  for (const field of orderedFields) {
    if (matchedFields.has(field)) {
      reasons.push({
        field,
        detail:
          field === "skills" && matchedSkills.length > 0
            ? matchedSkills.slice(0, 3).join(", ")
            : undefined,
      });
    }
  }

  return { score, reasons };
}

export function scoreLab(lab: LabWithPubs, query: string): number {
  return scoreLabWithReasons(lab, query).score;
}

export function filterAndRank(
  labs: LabWithPubs[],
  query: string,
  dept: string,
  skillFilters: string[],
  activity: ActivityFilter
): LabWithPubs[] {
  let results = labs;

  if (dept) results = results.filter((l) => l.department === dept);

  if (skillFilters.length) {
    results = results.filter((l) => {
      const labSkills = JSON.parse(l.skills) as string[];
      return skillFilters.every((f) => labSkills.includes(f));
    });
  }

  if (activity === "active") results = results.filter((l) => l.activityScore >= 75);
  else if (activity === "moderate") results = results.filter((l) => l.activityScore >= 50);

  const scored = results
    .map((lab) => ({ lab, ...scoreLabWithReasons(lab, query) }))
    .sort((a, b) => b.score - a.score);

  return (query.trim() ? scored.filter(({ score }) => score > 0) : scored).map(
    ({ lab }) => lab
  );
}

export function getMatchReasons(lab: LabWithPubs, query: string): MatchReason[] {
  return scoreLabWithReasons(lab, query).reasons;
}
