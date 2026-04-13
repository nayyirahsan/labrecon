import { count, desc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { grants, labs, publications } from "@/lib/db/schema";
import { LabCard } from "@/components/lab-card";
import { SearchForm } from "@/components/search-form";

export default function HomePage() {
  const topLabs = db
    .select()
    .from(labs)
    .orderBy(desc(labs.activityScore))
    .limit(6)
    .all();

  const labCount =
    db.select({ v: count() }).from(labs).all()[0]?.v ?? 0;
  const pubCount =
    db.select({ v: count() }).from(publications).all()[0]?.v ?? 0;
  const grantCount =
    db.select({ v: count() }).from(grants).all()[0]?.v ?? 0;

  const stats = [
    { value: labCount, label: "Labs indexed" },
    { value: pubCount, label: "Publications" },
    { value: grantCount, label: "Active grants" },
  ];

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center justify-center min-h-[46vh] px-4 sm:px-8 pt-16 pb-10">
        <div className="w-full max-w-2xl flex flex-col items-center text-center gap-7">
          {/* Eyebrow */}
          <p className="text-[11px] uppercase tracking-[0.15em] text-zinc-600">
            UT Austin · Research Intelligence
          </p>

          {/* Headline */}
          <h1
            className="text-[2.25rem] sm:text-5xl leading-[1.07] text-zinc-50"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Research the labs<br />before you email them.
          </h1>

          {/* Animated accent line */}
          <div className="accent-line" aria-hidden />

          {/* Search */}
          <SearchForm />

          {/* Hint */}
          <p className="text-[11px] text-zinc-700 -mt-2">
            Press{" "}
            <kbd className="px-1 py-px text-[10px] bg-zinc-800 border border-zinc-700 rounded-[3px] font-mono text-zinc-500">
              ↵
            </kbd>{" "}
            to search · 15 labs across CS, Bio, Neuro, BME, Physics
          </p>
        </div>
      </section>

      {/* ── Stat strip ────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-8 pb-14">
        <div className="max-w-2xl mx-auto flex gap-px bg-zinc-800/40 rounded-[4px] overflow-hidden">
          {stats.map(({ value, label }) => (
            <div
              key={label}
              className="flex-1 flex flex-col items-center justify-center gap-1.5 py-7 bg-zinc-950"
            >
              <span className="text-[36px] font-light leading-none text-zinc-100 tabular-nums">
                {value}
              </span>
              <span className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Active Labs ───────────────────────────────────────────────── */}
      <section className="flex-1 px-4 sm:px-8 pb-16">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-600">
                Active Labs
              </span>
              <span className="text-[10px] text-zinc-800">
                — sorted by recent activity
              </span>
            </div>
            <Link
              href="/search"
              className="text-[11px] text-zinc-700 hover:text-zinc-400 transition-colors duration-100"
            >
              View all →
            </Link>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-zinc-800/30 rounded-[4px] overflow-hidden">
            {topLabs.map((lab) => (
              <div key={lab.id} className="bg-zinc-950">
                <LabCard lab={lab} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
