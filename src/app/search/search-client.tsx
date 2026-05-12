"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import type { Publication, Researcher } from "@/lib/db/schema";

// ── Types ─────────────────────────────────────────────────────────────────────

type ResearcherResult = Researcher & {
  semantic_score?: number;
  combined_score?: number;
  pubs: Pick<Publication, "id" | "title" | "year" | "cited_by_count" | "venue">[];
};

type SearchMeta = {
  count: number;
  duration_ms: number;
  search_type: "semantic" | "listing";
  query: string;
};

// ── LocalStorage helpers ──────────────────────────────────────────────────────

const SAVED_KEY = "labrecon:saved:v2";

function getSaved(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

function writeSaved(ids: Set<string>) {
  localStorage.setItem(SAVED_KEY, JSON.stringify([...ids]));
}

// ── Skeleton cards ────────────────────────────────────────────────────────────

function ResultSkeleton({ index }: { index: number }) {
  return (
    <div
      className="px-5 py-4 bg-zinc-900 border border-zinc-800 rounded-[4px] flex flex-col gap-3 animate-pulse"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 flex flex-col gap-1.5">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-3 w-56" />
        </div>
        <Skeleton className="size-7 rounded-[3px] shrink-0" />
      </div>
      <Skeleton className="h-[11px] w-32" />
      <div className="flex flex-col gap-1">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-[82%]" />
        <Skeleton className="h-3 w-[65%]" />
      </div>
    </div>
  );
}

// ── Result card ───────────────────────────────────────────────────────────────

function ResultCard({
  researcher,
  saved,
  onSave,
  index,
}: {
  researcher: ResearcherResult;
  saved: boolean;
  onSave: (id: string) => void;
  index: number;
}) {
  const score = researcher.combined_score;
  const showBadge = typeof score === "number" && score > 0.5;

  return (
    <div
      className="animate-fade-up relative group"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <Link
        href={`/labs/${researcher.id}`}
        className="absolute inset-0 z-10 rounded-[4px]"
        aria-label={`View ${researcher.name}'s profile`}
      />

      <div
        className={cn(
          "relative flex flex-col gap-3 px-5 py-4",
          "bg-zinc-900 border border-zinc-800 rounded-[4px]",
          "transition-[border-color,box-shadow] duration-100 ease-out",
          "group-hover:border-blue-500/25",
          "group-hover:shadow-[0_4px_24px_rgba(59,130,246,0.05)]"
        )}
      >
        {/* Row 1: name + similarity badge + save */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className="text-[15px] leading-tight text-zinc-100"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {researcher.name}
              </h3>
              {showBadge && (
                <span className="inline-flex items-center px-1.5 py-[2px] text-[9px] uppercase tracking-wide font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-[3px] leading-none">
                  {Math.round(score * 100)}% match
                </span>
              )}
            </div>
            {researcher.title && (
              <p className="text-[11px] text-zinc-600 mt-0.5 truncate">{researcher.title}</p>
            )}
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSave(researcher.id);
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

        {/* Row 2: department */}
        {researcher.department && (
          <div className="-mt-1">
            <span className="text-[11px] text-zinc-600 truncate">
              {researcher.department}
            </span>
          </div>
        )}

        {/* Row 3: research summary */}
        {researcher.research_summary && (
          <p className="text-[12px] text-zinc-500 leading-[1.65] line-clamp-3">
            {researcher.research_summary}
          </p>
        )}

        {/* Row 4: top publications */}
        {researcher.pubs.length > 0 && (
          <div className="flex flex-col gap-0.5 pt-0.5 border-t border-zinc-800/60">
            {researcher.pubs.map((pub) => (
              <p key={pub.id} className="text-[11px] text-zinc-600 truncate">
                {pub.year && (
                  <span className="text-zinc-700 tabular-nums mr-1.5">{pub.year}</span>
                )}
                {pub.title}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Filter panel ──────────────────────────────────────────────────────────────

function FilterPanel({
  departments,
  dept,
  onDept,
  onClear,
}: {
  departments: string[];
  dept: string;
  onDept: (d: string) => void;
  onClear: () => void;
}) {
  const hasFilters = Boolean(dept);

  return (
    <div className="flex flex-col gap-6">
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
              {d}
            </option>
          ))}
        </select>
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
              No results for <span className="text-zinc-200">&ldquo;{query}&rdquo;</span>
            </p>
            <p className="text-[12px] text-zinc-700 mt-1.5 max-w-[260px]">
              Try a broader term — research area, technique, or PI last name
            </p>
          </>
        ) : (
          <p className="text-sm text-zinc-400">No researchers match your filters</p>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Props = {
  departments: string[];
  initialQuery: string;
  initialDept: string;
};

export function SearchClient({ departments, initialQuery, initialDept }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialQuery);
  const [dept, setDept] = useState(initialDept || (searchParams.get("department") ?? ""));
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<ResearcherResult[]>([]);
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [loading, setLoading] = useState(true);

  const abortRef = useRef<AbortController | null>(null);
  const urlTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSavedIds(getSaved());
  }, []);

  // Debounced fetch
  useEffect(() => {
    if (fetchTimer.current) clearTimeout(fetchTimer.current);
    fetchTimer.current = setTimeout(() => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);

      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (dept) params.set("department", dept);

      fetch(`/api/search?${params}`, { signal: controller.signal })
        .then((r) => r.json())
        .then(({ results: res, meta: m }) => {
          setResults(res ?? []);
          setMeta(m ?? null);
          setLoading(false);
        })
        .catch((err) => {
          if (err.name !== "AbortError") setLoading(false);
        });
    }, query ? 350 : 0);

    return () => {
      if (fetchTimer.current) clearTimeout(fetchTimer.current);
    };
  }, [query, dept]);

  // Debounced URL sync
  useEffect(() => {
    if (urlTimer.current) clearTimeout(urlTimer.current);
    urlTimer.current = setTimeout(() => {
      const p = new URLSearchParams();
      if (query) p.set("q", query);
      if (dept) p.set("department", dept);
      const qs = p.toString();
      router.replace(qs ? `/search?${qs}` : "/search", { scroll: false });
    }, 350);
    return () => {
      if (urlTimer.current) clearTimeout(urlTimer.current);
    };
  }, [query, dept, router]);

  const handleSave = useCallback((id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      writeSaved(next);
      return next;
    });
  }, []);

  const handleClear = useCallback(() => setDept(""), []);

  const filterCount = dept ? 1 : 0;

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Sticky search bar ───────────────────────────────────────── */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-5 h-[52px] bg-zinc-950 border-b border-zinc-800/60 focus-within:border-zinc-600 transition-colors duration-100">
        <Search size={14} className="text-zinc-600 shrink-0" aria-hidden="true" />
        <label htmlFor="lab-search" className="sr-only">Search researchers</label>

        <input
          id="lab-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search researchers, PIs, research areas, techniques…"
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
              dept
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
                dept={dept}
                onDept={setDept}
                onClear={handleClear}
              />
            </div>
          </SheetContent>
        </Sheet>

        <span className="ml-auto text-[11px] text-zinc-700 tabular-nums">
          {loading ? "—" : `${results.length} result${results.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* ── Body ────────────────────────────────────────────────────── */}
      <div className="flex flex-1">
        {/* Filter sidebar — desktop only */}
        <aside aria-label="Search filters" className="hidden md:block w-[232px] shrink-0 border-r border-zinc-800/60">
          <div className="sticky top-[52px] p-5 pt-6">
            <FilterPanel
              departments={departments}
              dept={dept}
              onDept={setDept}
              onClear={handleClear}
            />
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 px-4 md:px-6 py-5 min-w-0">
          {/* Status line — desktop only */}
          <div className="hidden md:flex items-center gap-2 mb-4 h-6">
            {loading ? (
              <Skeleton className="h-[11px] w-32" />
            ) : meta ? (
              <span className="text-[11px] text-zinc-600 animate-page-fade-in">
                {results.length === 0
                  ? "No results"
                  : `${results.length.toLocaleString()} researcher${results.length !== 1 ? "s" : ""}`}
                {query && (
                  <>
                    {" "}for <span className="text-zinc-400">&ldquo;{query}&rdquo;</span>
                  </>
                )}
                {meta.search_type === "semantic" && (
                  <span className="ml-2 text-zinc-700">· semantic · {meta.duration_ms}ms</span>
                )}
              </span>
            ) : (
              <span className="text-[11px] text-zinc-700">Searching…</span>
            )}
          </div>

          {/* Results list */}
          {loading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <ResultSkeleton key={i} index={i} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <EmptyState query={query} />
          ) : (
            <div key={`${query}|${dept}`} className="flex flex-col gap-2">
              {results.map((r, i) => (
                <ResultCard
                  key={r.id}
                  researcher={r}
                  saved={savedIds.has(r.id)}
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
