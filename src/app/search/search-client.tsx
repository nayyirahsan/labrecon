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
import {
  filterAndRank,
  getMatchReasons,
  type ActivityFilter,
  type LabWithPubs,
  type MatchReason,
} from "@/lib/search";
import type { Lab } from "@/lib/db/schema";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

// ── LocalStorage helpers ──────────────────────────────────────────────────────

const SAVED_KEY = "labrecon:saved";
const MAX_RENDERED_RESULTS = 50;

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

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function formatMatchReasons(reasons: MatchReason[]): string {
  if (!reasons.length) return "";
  const parts = reasons.slice(0, 3).map((r) => {
    switch (r.field) {
      case "pi_name": return "PI name";
      case "lab_name": return "lab name";
      case "skills": return r.detail ? `skills (${r.detail})` : "skills";
      case "department": return "department";
      case "research_summary": return "research summary";
      case "publications": return "publications";
    }
  });
  return `Matched: ${parts.join(", ")}`;
}

// ── Autocomplete ──────────────────────────────────────────────────────────────

type SuggestionItem = {
  type: "pi" | "lab" | "skill" | "dept";
  label: string;
  query: string;
};

function buildSuggestions(
  allLabs: LabWithPubs[],
  query: string
): SuggestionItem[] {
  if (!query.trim() || query.length < 2) return [];
  const q = query.toLowerCase();
  const seen = new Set<string>();
  const results: SuggestionItem[] = [];

  for (const lab of allLabs) {
    if (results.length >= 6) break;

    // PI name match
    if (lab.piName.toLowerCase().includes(q) && !seen.has(lab.piName)) {
      seen.add(lab.piName);
      results.push({ type: "pi", label: lab.piName, query: lab.piName });
    }

    // Lab name match
    if (lab.labName.toLowerCase().includes(q) && !seen.has(lab.labName)) {
      seen.add(lab.labName);
      results.push({ type: "lab", label: lab.labName, query: lab.labName });
    }

    // Department match (short form)
    const shortDept = lab.department
      .replace("Department of ", "")
      .replace("School of ", "");
    if (
      shortDept.toLowerCase().includes(q) &&
      !seen.has(shortDept)
    ) {
      seen.add(shortDept);
      results.push({ type: "dept", label: shortDept, query: lab.department });
    }

    // Skills
    const skills = JSON.parse(lab.skills) as string[];
    for (const skill of skills) {
      if (results.length >= 6) break;
      if (skill.toLowerCase().includes(q) && !seen.has(skill)) {
        seen.add(skill);
        results.push({ type: "skill", label: skill, query: skill });
      }
    }
  }

  return results.slice(0, 5);
}

function SuggestionTag({ type }: { type: SuggestionItem["type"] }) {
  const labels: Record<SuggestionItem["type"], string> = {
    pi: "PI",
    lab: "Lab",
    skill: "Skill",
    dept: "Dept",
  };
  return (
    <span className="text-[9px] uppercase tracking-wide text-zinc-700 w-8 shrink-0 text-right">
      {labels[type]}
    </span>
  );
}

// ── Search result card ────────────────────────────────────────────────────────

function ResultCard({
  lab,
  saved,
  onSave,
  index,
  query,
}: {
  lab: LabWithPubs;
  saved: boolean;
  onSave: (id: number) => void;
  index: number;
  query: string;
}) {
  const skills = JSON.parse(lab.skills) as string[];
  const displaySkills = skills.slice(0, 5);
  const overflow = skills.length - 5;
  const reasons = useMemo(
    () => (query.trim() ? getMatchReasons(lab, query) : []),
    [lab, query]
  );
  const matchText = formatMatchReasons(reasons);

  return (
    <div
      className="animate-fade-up relative group"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Overlay link */}
      <Link
        href={`/labs/${lab.id}`}
        className="absolute inset-0 z-10 rounded-[4px]"
        aria-label={`View ${lab.piName}'s lab`}
      />

      {/* Card body */}
      <div
        className={cn(
          "relative flex flex-col gap-3 px-5 py-4",
          "bg-zinc-900 border border-zinc-800 rounded-[4px]",
          "transition-[border-color,box-shadow,transform] duration-100 ease-out",
          "group-hover:border-blue-500/25",
          "group-hover:shadow-[0_4px_24px_rgba(59,130,246,0.05)]"
        )}
      >
        {/* Row 1: PI name + dots + save */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3
                className="text-[15px] leading-tight text-zinc-100 text-pretty"
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

          {/* Save button — z-20 so it's above the overlay link */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSave(lab.id);
            }}
            aria-label={saved ? "Remove from tracker" : "Save to tracker"}
            className={cn(
              "relative z-20 flex items-center justify-center",
              "size-9 rounded-[3px] shrink-0",
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
            {lab.department.replace("Department of ", "").replace("School of ", "")}
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

        {/* Row 5: Match reason */}
        {matchText && (
          <p className="text-[10px] text-zinc-700 leading-none">
            {matchText}
          </p>
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
          aria-label="Filter by department"
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
              {d.replace("Department of ", "").replace("School of ", "")}
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
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none" className="text-white">
                      <path d="M1 3L3 5L7 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
        <Search size={18} className="text-zinc-700" aria-hidden="true" />
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

  // Autocomplete
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(
    () => buildSuggestions(allLabs, query),
    [allLabs, query]
  );

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

  const filterKey = `${query}|${dept}|${skillFilters.join(",")}|${activity}`;

  const results = useMemo(
    () => filterAndRank(allLabs, query, dept, skillFilters, activity).slice(0, MAX_RENDERED_RESULTS),
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

  function applySuggestion(s: SuggestionItem) {
    setQuery(s.query);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions || !suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSuggestion((s) => Math.min(s + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSuggestion((s) => Math.max(s - 1, -1));
    } else if (e.key === "Enter" && selectedSuggestion >= 0) {
      e.preventDefault();
      applySuggestion(suggestions[selectedSuggestion]);
    } else if (e.key === "Enter") {
      setShowSuggestions(false);
      setSelectedSuggestion(-1);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Sticky search bar ───────────────────────────────────────── */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-5 h-[52px] bg-zinc-950 border-b border-zinc-800/60 focus-within:border-zinc-600 transition-colors duration-100">
        <Search size={14} className="text-zinc-600 shrink-0" aria-hidden="true" />
        <label htmlFor="lab-search" className="sr-only">Search labs</label>

        <div className="relative flex-1 h-full flex items-center">
          <input
            ref={inputRef}
            id="lab-search"
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
              setSelectedSuggestion(-1);
            }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={onInputKeyDown}
            placeholder="Search labs, PIs, research areas, techniques…"
            autoFocus
            className={cn(
              "w-full h-full bg-transparent",
              "text-sm text-zinc-100 placeholder:text-zinc-700",
              "outline-none border-none"
            )}
          />

          {/* Autocomplete dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-[4px] shadow-xl z-30 overflow-hidden"
              onMouseDown={(e) => e.preventDefault()}
            >
              {suggestions.map((s, i) => (
                <button
                  key={`${s.type}-${s.label}`}
                  onClick={() => applySuggestion(s)}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left",
                    "text-[12px] transition-colors duration-75",
                    i === selectedSuggestion
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                  )}
                >
                  <span className="truncate">{s.label}</span>
                  <SuggestionTag type={s.type} />
                </button>
              ))}
            </div>
          )}
        </div>

        {query && (
          <button
            onClick={() => {
              setQuery("");
              setShowSuggestions(false);
              setSelectedSuggestion(-1);
            }}
            className="text-zinc-700 hover:text-zinc-400 transition-colors shrink-0"
            aria-label="Clear search"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* ── Mobile filter bar ───────────────────────────────────────── */}
      <div className="md:hidden flex items-center gap-3 px-5 py-2.5 border-b border-zinc-800/50">
        <Sheet>
          <SheetTrigger
            className={cn(
              "inline-flex items-center gap-1.5 h-10 px-3 rounded-[3px] text-[12px]",
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
          {/* Count / status line — desktop only */}
          <div className="hidden md:flex items-center gap-2 mb-4 h-6">
            {query || hasFilters ? (
              <span className="text-[11px] text-zinc-600 animate-page-fade-in">
                {results.length === 0
                  ? "No results"
                  : `${results.length.toLocaleString()} researcher${results.length !== 1 ? "s" : ""}`}
                {query && (
                  <>
                    {" "}match{results.length !== 1 ? "" : "es"}{" "}
                    <span className="text-zinc-400">"{query}"</span>
                  </>
                )}
              </span>
            ) : (
              <span className="text-[11px] text-zinc-700">
                {allLabs.length.toLocaleString()} researchers · sorted by activity
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
                  query={query}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
