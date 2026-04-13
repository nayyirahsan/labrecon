"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bookmark,
  BookmarkCheck,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { filterAndRank, type ActivityFilter, type LabWithPubs } from "@/lib/search";
import type { Lab } from "@/lib/db/schema";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

// ── LocalStorage helpers ──────────────────────────────────────────────────────

const SAVED_KEY = "labrecon:saved";

function getSaved(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]") as number[]);
  } catch {
    return new Set();
  }
}

function writeSaved(ids: Set<number>) {
  localStorage.setItem(SAVED_KEY, JSON.stringify([...ids]));
}

// ── Dot indicator ─────────────────────────────────────────────────────────────

function activityDot(score: number) {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function activityLabel(score: number) {
  if (score >= 75) return "Active";
  if (score >= 50) return "Moderate";
  return "Stale";
}

// ── Search result card ────────────────────────────────────────────────────────

function ResultCard({
  lab,
  saved,
  onSave,
  index,
}: {
  lab: LabWithPubs;
  saved: boolean;
  onSave: (id: number) => void;
  index: number;
}) {
  const skills = JSON.parse(lab.skills) as string[];
  const displaySkills = skills.slice(0, 5);
  const overflow = skills.length - 5;

  return (
    <div
      className="animate-fade-up relative group"
      style={{ animationDelay: `${index * 35}ms` }}
    >
      {/* Overlay link — covers whole card but save button sits above it */}
      <Link
        href={`/labs/${lab.id}`}
        className="absolute inset-0 z-0 rounded-[4px]"
        aria-label={`View ${lab.piName}'s lab`}
      />

      {/* Card body */}
      <div
        className={cn(
          "relative flex flex-col gap-3 px-5 py-4",
          "bg-zinc-900 border border-zinc-800 rounded-[4px]",
          "transition-all duration-100 ease-out",
          "group-hover:border-blue-500/25",
          "group-hover:shadow-[0_4px_24px_rgba(59,130,246,0.05)]"
        )}
      >
        {/* Row 1: PI name + dots + save */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3
                className="text-[15px] leading-tight text-zinc-100"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {lab.piName}
              </h3>
              <span
                className={cn(
                  "size-[6px] rounded-full shrink-0",
                  activityDot(lab.activityScore)
                )}
                title={activityLabel(lab.activityScore)}
              />
            </div>
            <p className="text-[11px] text-zinc-600 mt-0.5 truncate">
              {lab.piTitle}
            </p>
          </div>

          {/* Save button — z-10 so it's above the overlay link */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSave(lab.id);
            }}
            aria-label={saved ? "Remove from tracker" : "Save to tracker"}
            className={cn(
              "relative z-10 flex items-center justify-center",
              "size-7 rounded-[3px] shrink-0",
              "transition-colors duration-100",
              saved
                ? "text-blue-400 hover:text-blue-300"
                : "text-zinc-700 hover:text-zinc-400 hover:bg-zinc-800"
            )}
          >
            {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
          </button>
        </div>

        {/* Row 2: Lab name + dept */}
        <div className="flex items-baseline gap-2 -mt-1">
          <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wide truncate">
            {lab.labName}
          </span>
          <span className="text-zinc-800 text-[11px]">·</span>
          <span className="text-[11px] text-zinc-700 truncate shrink-0">
            {lab.department.replace("Department of ", "")}
          </span>
        </div>

        {/* Row 3: Research summary — 3-line clamp */}
        <p className="text-[12px] text-zinc-500 leading-[1.65] line-clamp-3">
          {lab.researchSummary}
        </p>

        {/* Row 4: Skills */}
        {displaySkills.length > 0 && (
          <div className="flex flex-wrap gap-1">
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
      </div>
    </div>
  );
}

// ── Filter panel ──────────────────────────────────────────────────────────────

function FilterPanel({
  departments,
  allSkills,
  dept,
  skillFilters,
  activity,
  onDept,
  onSkillToggle,
  onActivity,
  onClear,
}: {
  departments: string[];
  allSkills: string[];
  dept: string;
  skillFilters: string[];
  activity: ActivityFilter;
  onDept: (d: string) => void;
  onSkillToggle: (s: string) => void;
  onActivity: (a: ActivityFilter) => void;
  onClear: () => void;
}) {
  const hasFilters = dept || skillFilters.length > 0 || activity !== "all";
  const activityOptions: { value: ActivityFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "moderate", label: "Moderate+" },
  ];

  return (
    <div className="animate-slide-in-left flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-zinc-600">
          <SlidersHorizontal size={11} />
          Filters
        </div>
        {hasFilters && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <X size={10} />
            Clear
          </button>
        )}
      </div>

      {/* Department */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-[0.12em] text-zinc-700">
          Department
        </span>
        <select
          value={dept}
          onChange={(e) => onDept(e.target.value)}
          className={cn(
            "w-full h-8 px-2 text-[12px] rounded-[3px]",
            "bg-zinc-900 border border-zinc-800",
            "text-zinc-300 appearance-none",
            "focus:outline-none focus:border-zinc-600",
            "transition-colors duration-100"
          )}
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d.replace("Department of ", "")}
            </option>
          ))}
        </select>
      </div>

      {/* Skills */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-[0.12em] text-zinc-700">
          Skills
        </span>
        <div className="flex flex-col gap-0.5 max-h-64 overflow-y-auto pr-1 -mr-1">
          {allSkills.map((skill) => {
            const checked = skillFilters.includes(skill);
            return (
              <label
                key={skill}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-[3px] cursor-pointer",
                  "text-[12px] transition-colors duration-75",
                  checked
                    ? "bg-zinc-800 text-zinc-200"
                    : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300"
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onSkillToggle(skill)}
                  className="sr-only"
                />
                <span
                  className={cn(
                    "size-3 rounded-[2px] border shrink-0 flex items-center justify-center transition-colors",
                    checked
                      ? "bg-blue-500 border-blue-500"
                      : "border-zinc-700"
                  )}
                >
                  {checked && (
                    <svg
                      width="8"
                      height="6"
                      viewBox="0 0 8 6"
                      fill="none"
                      className="text-white"
                    >
                      <path
                        d="M1 3L3 5L7 1"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                {skill}
              </label>
            );
          })}
        </div>
      </div>

      {/* Activity */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-[0.12em] text-zinc-700">
          Activity Level
        </span>
        <div className="flex flex-col gap-0.5">
          {activityOptions.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onActivity(value)}
              aria-pressed={activity === value}
              className={cn(
                "flex items-center gap-2 h-7 px-2 rounded-[3px] text-[12px] text-left",
                "transition-colors duration-75",
                activity === value
                  ? "bg-zinc-800 text-zinc-200"
                  : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300"
              )}
            >
              <span
                className={cn(
                  "size-[6px] rounded-full",
                  value === "active" && "bg-emerald-500",
                  value === "moderate" && "bg-amber-500",
                  value === "all" && "bg-zinc-600"
                )}
              />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 gap-5 text-center">
      <div className="size-12 flex items-center justify-center rounded-full bg-zinc-900 border border-zinc-800">
        <Search size={18} className="text-zinc-700" />
      </div>
      <div>
        {query ? (
          <>
            <p className="text-sm text-zinc-400">
              No results for{" "}
              <span className="text-zinc-200">"{query}"</span>
            </p>
            <p className="text-[12px] text-zinc-700 mt-1.5 max-w-[260px]">
              Try a broader term — research area, technique, or PI last name
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-zinc-400">No labs match your filters</p>
            <p className="text-[12px] text-zinc-700 mt-1.5">
              Adjust the filters to see results
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Props = {
  allLabs: LabWithPubs[];
  departments: string[];
  allSkills: string[];
  initialQuery: string;
};

export function SearchClient({ allLabs, departments, allSkills, initialQuery }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialQuery);
  const [dept, setDept] = useState(searchParams.get("dept") ?? "");
  const [skillFilters, setSkillFilters] = useState<string[]>(() => {
    const s = searchParams.get("skills");
    return s ? s.split(",").filter(Boolean) : [];
  });
  const [activity, setActivity] = useState<ActivityFilter>(
    (searchParams.get("activity") as ActivityFilter) ?? "all"
  );
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  // Load saved IDs from localStorage after mount
  useEffect(() => {
    setSavedIds(getSaved());
  }, []);

  // Debounced URL sync
  const urlTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (urlTimer.current) clearTimeout(urlTimer.current);
    urlTimer.current = setTimeout(() => {
      const p = new URLSearchParams();
      if (query) p.set("q", query);
      if (dept) p.set("dept", dept);
      if (skillFilters.length) p.set("skills", skillFilters.join(","));
      if (activity !== "all") p.set("activity", activity);
      const qs = p.toString();
      router.replace(qs ? `/search?${qs}` : "/search", { scroll: false });
    }, 350);
    return () => {
      if (urlTimer.current) clearTimeout(urlTimer.current);
    };
  }, [query, dept, skillFilters, activity, router]);

  // Filter key — changing this re-mounts results and restarts stagger animation
  const filterKey = `${query}|${dept}|${skillFilters.join(",")}|${activity}`;

  const results = useMemo(
    () => filterAndRank(allLabs, query, dept, skillFilters, activity),
    [allLabs, query, dept, skillFilters, activity]
  );

  const handleSave = useCallback((id: number) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      writeSaved(next);
      return next;
    });
  }, []);

  const handleSkillToggle = useCallback((skill: string) => {
    setSkillFilters((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }, []);

  const handleClear = useCallback(() => {
    setDept("");
    setSkillFilters([]);
    setActivity("all");
  }, []);

  const hasFilters = dept || skillFilters.length > 0 || activity !== "all";
  const filterCount = (dept ? 1 : 0) + skillFilters.length + (activity !== "all" ? 1 : 0);

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Sticky search bar ───────────────────────────────────────── */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-5 h-[52px] bg-zinc-950 border-b border-zinc-800/60">
        <Search size={14} className="text-zinc-600 shrink-0" aria-hidden="true" />
        <label htmlFor="lab-search" className="sr-only">Search labs</label>
        <input
          id="lab-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search labs, PIs, research areas, techniques…"
          autoFocus
          className={cn(
            "flex-1 h-full bg-transparent",
            "text-sm text-zinc-100 placeholder:text-zinc-700",
            "outline-none border-none"
          )}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="text-zinc-700 hover:text-zinc-400 transition-colors"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* ── Mobile filter bar (hidden on desktop) ───────────────────── */}
      <div className="md:hidden flex items-center gap-3 px-5 py-2.5 border-b border-zinc-800/50">
        <Sheet>
          <SheetTrigger
            className={cn(
              "inline-flex items-center gap-1.5 h-7 px-3 rounded-[3px] text-[12px]",
              "border transition-colors duration-100 cursor-pointer",
              hasFilters
                ? "border-blue-500/30 text-blue-400 bg-blue-500/5"
                : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
            )}
          >
            <SlidersHorizontal size={12} />
            Filters
            {filterCount > 0 && (
              <span className="inline-flex items-center justify-center size-4 text-[10px] bg-blue-500 text-white rounded-full leading-none">
                {filterCount}
              </span>
            )}
          </SheetTrigger>

          <SheetContent
            side="left"
            showCloseButton={false}
            className="!w-[280px] flex flex-col p-0 bg-zinc-950 border-r border-zinc-800/60"
          >
            <div className="flex items-center justify-between h-12 px-5 border-b border-zinc-800/60 shrink-0">
              <span className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                Filters
              </span>
              <SheetClose className="text-zinc-600 hover:text-zinc-300 transition-colors duration-100 cursor-pointer">
                <X size={14} />
                <span className="sr-only">Close</span>
              </SheetClose>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <FilterPanel
                departments={departments}
                allSkills={allSkills}
                dept={dept}
                skillFilters={skillFilters}
                activity={activity}
                onDept={setDept}
                onSkillToggle={handleSkillToggle}
                onActivity={setActivity}
                onClear={handleClear}
              />
            </div>
          </SheetContent>
        </Sheet>

        <span className="ml-auto text-[11px] text-zinc-700 tabular-nums">
          {query || hasFilters
            ? `${results.length} result${results.length !== 1 ? "s" : ""}`
            : `${allLabs.length} labs`}
        </span>
      </div>

      {/* ── Body ────────────────────────────────────────────────────── */}
      <div className="flex flex-1">
        {/* Filter sidebar — desktop only */}
        <aside aria-label="Search filters" className="hidden md:block w-[232px] shrink-0 border-r border-zinc-800/60">
          <div className="sticky top-[52px] p-5 pt-6">
            <FilterPanel
              departments={departments}
              allSkills={allSkills}
              dept={dept}
              skillFilters={skillFilters}
              activity={activity}
              onDept={setDept}
              onSkillToggle={handleSkillToggle}
              onActivity={setActivity}
              onClear={handleClear}
            />
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 px-4 md:px-6 py-5 min-w-0">
          {/* Count / status line — desktop only (mobile shows in filter bar) */}
          <div className="hidden md:flex items-center gap-2 mb-4 h-6">
            {query || hasFilters ? (
              <span className="text-[11px] text-zinc-600">
                {results.length === 0
                  ? "No results"
                  : `${results.length} result${results.length !== 1 ? "s" : ""}`}
                {query && (
                  <>
                    {" "}for{" "}
                    <span className="text-zinc-400">"{query}"</span>
                  </>
                )}
              </span>
            ) : (
              <span className="text-[11px] text-zinc-700">
                {allLabs.length} labs · sorted by activity
              </span>
            )}
          </div>

          {/* Results list */}
          {results.length === 0 ? (
            <EmptyState query={query} />
          ) : (
            <div key={filterKey} className="flex flex-col gap-2">
              {results.map((lab, i) => (
                <ResultCard
                  key={lab.id}
                  lab={lab}
                  saved={savedIds.has(lab.id)}
                  onSave={handleSave}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
