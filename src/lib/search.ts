import type { Lab, Publication } from "@/lib/db/schema";

export type LabWithPubs = Lab & { pubs: Publication[] };

export type ActivityFilter = "all" | "active" | "moderate";

// Escape regex special chars
function esc(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Count non-overlapping occurrences of `term` in `text`
function countMatches(text: string, term: string): number {
  return (text.match(new RegExp(esc(term), "g")) ?? []).length;
}

export function scoreLab(lab: LabWithPubs, query: string): number {
  if (!query.trim()) return lab.activityScore;

  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1);
  if (!terms.length) return lab.activityScore;

  const skills = JSON.parse(lab.skills) as string[];
  let score = 0;

  for (const term of terms) {
    const pi = lab.piName.toLowerCase();
    const ln = lab.labName.toLowerCase();
    const rs = lab.researchSummary.toLowerCase();
    const dept = lab.department.toLowerCase();

    // PI name — highest signal
    if (pi === term) score += 140;
    else if (pi.startsWith(term)) score += 90;
    else if (pi.includes(term)) score += 55;

    // Lab name
    if (ln.includes(term)) score += 45;

    // Department / college
    if (dept.includes(term)) score += 25;
    if (lab.college.toLowerCase().includes(term)) score += 15;

    // Research summary — frequency weighted
    score += countMatches(rs, term) * 20;

    // Skills — strong signal (user knows what they want)
    for (const skill of skills) {
      if (skill.toLowerCase().includes(term)) score += 65;
    }

    // Publications — title beats abstract
    for (const pub of lab.pubs) {
      score += countMatches(pub.title.toLowerCase(), term) * 18;
      if (pub.abstract) {
        score += countMatches(pub.abstract.toLowerCase(), term) * 5;
      }
    }
  }

  return score;
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
    .map((lab) => ({ lab, score: scoreLab(lab, query) }))
    .sort((a, b) => b.score - a.score);

  // When querying, hide zero-score results
  return (query.trim() ? scored.filter(({ score }) => score > 0) : scored).map(
    ({ lab }) => lab
  );
}
