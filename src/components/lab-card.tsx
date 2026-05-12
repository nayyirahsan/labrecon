"use client";

import Link from "next/link";
import { type Researcher } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

type Props = {
  researcher: Omit<Researcher, 'embedding'> & { embedding?: Researcher['embedding'] };
  topPubAbstract?: string | null;
};

export function LabCard({ researcher, topPubAbstract }: Props) {
  const summary =
    researcher.research_summary ||
    (topPubAbstract
      ? topPubAbstract.length > 300
        ? topPubAbstract.slice(0, 300) + "…"
        : topPubAbstract
      : null);

  return (
    <Link
      href={`/labs/${researcher.id}`}
      className={cn(
        "group relative flex flex-col gap-3.5 p-5",
        "bg-zinc-900 border border-zinc-800 rounded-[4px]",
        "transition-[border-color,box-shadow,transform] duration-100 ease-out",
        "hover:-translate-y-px",
        "hover:border-blue-500/25",
        "hover:shadow-[0_8px_32px_rgba(59,130,246,0.05)]"
      )}
    >
      {/* Header row: name + department */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3
            className="text-[15px] leading-snug text-zinc-100 text-pretty"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {researcher.name}
          </h3>
          <p className="text-[11px] text-zinc-600 mt-0.5 truncate leading-none">
            {researcher.department}
          </p>
        </div>
      </div>

      {/* Research summary — 2-line clamp */}
      {summary && (
        <p className="text-[12px] text-zinc-500 leading-[1.6] line-clamp-2 flex-1">
          {summary}
        </p>
      )}
    </Link>
  );
}
