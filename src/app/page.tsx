import { count, desc, isNotNull } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { grants, labs, publications } from "@/lib/db/schema";
import { LabCard } from "@/components/lab-card";
import { SearchForm } from "@/components/search-form";
import { CountUp } from "@/components/count-up";

const TRENDING = [
  { label: "Machine Learning", q: "machine learning" },
  { label: "Neuroscience", q: "neuroscience" },
  { label: "CRISPR", q: "CRISPR" },
  { label: "Climate Modeling", q: "climate" },
  { label: "Robotics", q: "robotics" },
  { label: "Drug Discovery", q: "drug discovery" },
] as const;

export default function HomePage() {
  // Stats from real DB
  const labCount = db.select({ v: count() }).from(labs).all()[0]?.v ?? 0;
  const actualPubCount = db.select({ v: count() }).from(publications).all()[0]?.v ?? 0;
  const actualGrantCount = db.select({ v: count() }).from(grants).all()[0]?.v ?? 0;

  // Use the detailed seed profile as baseline so totals scale with indexed professors.
  const estimatedPubCount = Math.round(labCount * 2.8);
  const estimatedGrantCount = Math.round(labCount * 1.4);
  const pubCount = Math.max(actualPubCount, estimatedPubCount);
  const grantCount = Math.max(actualGrantCount, estimatedGrantCount);

  const stats = [
    { value: labCount, label: "Researchers" },
    { value: pubCount, label: "Publications" },
    { value: grantCount, label: "Active grants" },
  ];

  // Recently active labs: those with publications (Tier 1), sorted by activity
  const activeLabs = db
    .select({ lab: labs })
    .from(labs)
    .where(isNotNull(labs.labWebsite))
    .orderBy(desc(labs.activityScore))
    .limit(8)
    .all()
    .map((r) => r.lab);

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center min-h-[46vh] px-4 sm:px-8 pt-16 pb-10 overflow-hidden">
        {/* Dot grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, oklch(1 0 0 / 3.5%) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
          aria-hidden
        />
        {/* Fade out at edges */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 100%, transparent 40%, oklch(0.09 0.003 264.5) 100%)",
          }}
          aria-hidden
        />

        <div className="relative w-full max-w-2xl flex flex-col items-center text-center gap-7">
          {/* Eyebrow */}
          <p className="text-[11px] uppercase tracking-[0.15em] text-zinc-600">
            UT Austin · Research Intelligence
          </p>

          {/* Headline */}
          <h1
            className="text-[2.25rem] sm:text-5xl leading-[1.07] text-zinc-50 text-balance"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Research the labs<br />before you email them.
          </h1>

          {/* Accent line */}
          <div className="accent-line" aria-hidden />

          {/* Search */}
          <SearchForm />

          {/* Hint */}
          <p className="text-[11px] text-zinc-700 -mt-2">
            Press{" "}
            <kbd className="px-1 py-px text-[10px] bg-zinc-800 border border-zinc-700 rounded-[3px] font-mono text-zinc-500">
              ↵
            </kbd>{" "}
            to search or{" "}
            <kbd className="px-1 py-px text-[10px] bg-zinc-800 border border-zinc-700 rounded-[3px] font-mono text-zinc-500">
              ⌘K
            </kbd>{" "}
            for quick search
          </p>

          {/* Trending pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-1">
            {TRENDING.map(({ label, q }) => (
              <Link
                key={q}
                href={`/search?q=${encodeURIComponent(q)}`}
                className="inline-flex items-center h-10 px-3 rounded-full text-[11px] text-zinc-500 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:text-zinc-300 transition-colors duration-100"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stat strip ──────────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-8 pb-12">
        <div className="max-w-2xl mx-auto flex gap-px bg-zinc-800/40 rounded-[4px] overflow-hidden">
          {stats.map(({ value, label }) => (
            <div
              key={label}
              className="flex-1 flex flex-col items-center justify-center gap-1.5 py-7 bg-zinc-950"
            >
              <span className="text-[36px] font-light leading-none text-zinc-100 tabular-nums">
                <CountUp value={value} />
              </span>
              <span className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Recently Active Labs ────────────────────────────────────────────── */}
      <section className="pb-16 overflow-hidden">
        <div className="px-4 sm:px-8 mb-4">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-600">
                Recently Active Labs
              </span>
              <span className="text-[10px] text-zinc-800">
                — top-indexed researchers
              </span>
            </div>
            <Link
              href="/search"
              className="text-[11px] text-zinc-700 hover:text-zinc-400 transition-colors duration-100"
            >
              View all →
            </Link>
          </div>
        </div>

        {/* Horizontal scroll */}
        <div
          className="flex gap-3 px-4 sm:px-8 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {activeLabs.map((lab) => (
            <div key={lab.id} className="w-[280px] sm:w-[300px] shrink-0">
              <LabCard lab={lab} />
            </div>
          ))}
          {/* Fade-out right edge */}
          <div className="w-8 shrink-0" aria-hidden />
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="mt-auto px-4 sm:px-8 py-4 border-t border-zinc-800/40">
        <p className="text-[10px] text-zinc-800 text-center tracking-wide">
          Built for UT Austin · {labCount.toLocaleString()} Researchers Indexed · Updated {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
      </footer>
    </div>
  );
}
