"use client";

import Link from "next/link";
import { type Lab } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

function activityDotClass(score: number) {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function activityLabel(score: number) {
  if (score >= 75) return "Active";
  if (score >= 50) return "Moderate";
  return "Stale";
}

type Props = { lab: Lab };

export function LabCard({ lab }: Props) {
  const skills = JSON.parse(lab.skills) as string[];
  const displaySkills = skills.slice(0, 4);
  const overflow = skills.length - 4;

  return (
    <Link
      href={`/labs/${lab.id}`}
      className={cn(
        "group relative flex flex-col gap-3.5 p-5",
        "bg-zinc-900 border border-zinc-800 rounded-[4px]",
        "transition-all duration-100 ease-out",
        "hover:-translate-y-px",
        "hover:border-blue-500/25",
        "hover:shadow-[0_8px_32px_rgba(59,130,246,0.05)]"
      )}
    >
      {/* Header row: PI name + activity dot */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3
            className="text-[15px] leading-snug text-zinc-100"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {lab.piName}
          </h3>
          <p className="text-[11px] text-zinc-600 mt-0.5 truncate leading-none">
            {lab.department}
          </p>
        </div>
        <span
          className={cn(
            "mt-1 size-[7px] rounded-full shrink-0",
            activityDotClass(lab.activityScore)
          )}
          title={activityLabel(lab.activityScore)}
        />
      </div>

      {/* Lab name */}
      <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wide -mt-1 truncate">
        {lab.labName}
      </p>

      {/* Research summary — 2-line clamp */}
      <p className="text-[12px] text-zinc-500 leading-[1.6] line-clamp-2 flex-1">
        {lab.researchSummary}
      </p>

      {/* Skill pills */}
      {displaySkills.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-auto">
          {displaySkills.map((skill) => (
            <span
              key={skill}
              className="inline-block px-1.5 py-[3px] text-[10px] text-zinc-400 bg-slate-800/80 rounded-[3px] leading-none"
            >
              {skill}
            </span>
          ))}
          {overflow > 0 && (
            <span className="inline-block px-1.5 py-[3px] text-[10px] text-zinc-600 bg-slate-800/50 rounded-[3px] leading-none">
              +{overflow}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
