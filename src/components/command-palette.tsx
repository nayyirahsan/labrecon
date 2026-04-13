"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type LabResult = {
  id: number;
  piName: string;
  labName: string;
  department: string;
};

type Props = { labCount: number };

export function CommandPalette({ labCount }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LabResult[]>([]);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const router = useRouter();

  // Open / close on Cmd+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Focus + reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // Debounced fetch — 200ms after last keystroke, abort previous in-flight
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    controllerRef.current?.abort();

    if (!query.trim()) {
      setResults([]);
      return;
    }

    timerRef.current = setTimeout(() => {
      const controller = new AbortController();
      controllerRef.current = controller;
      fetch(`/api/labs-search?q=${encodeURIComponent(query)}&limit=6`, {
        signal: controller.signal,
      })
        .then((r) => r.json())
        .then((d: { labs?: LabResult[] }) => {
          setResults(d.labs ?? []);
          setSelected(0);
        })
        .catch(() => {});
    }, 200);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      controllerRef.current?.abort();
    };
  }, [query]);

  const navigate = useCallback(
    (id: number) => {
      setOpen(false);
      router.push(`/labs/${id}`);
    },
    [router]
  );

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    }
    if (e.key === "Enter" && results[selected]) {
      navigate(results[selected].id);
    }
    if (e.key === "Enter" && !results.length && query.trim()) {
      setOpen(false);
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh] px-4"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-zinc-950/75 backdrop-blur-[2px]" aria-hidden="true" />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Quick search"
      >
        <div className="bg-zinc-900 border border-zinc-700/80 rounded-[6px] shadow-[0_24px_80px_rgba(0,0,0,0.7)] overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 h-[52px] border-b border-zinc-800/60">
            <Search size={14} className="text-zinc-500 shrink-0" aria-hidden="true" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              autoComplete="off"
              spellCheck={false}
              placeholder="Search researchers, labs, departments…"
              className="flex-1 bg-transparent text-[13px] text-zinc-100 placeholder:text-zinc-600 outline-none"
              aria-label="Command palette search"
            />
            <button
              onClick={() => setOpen(false)}
              className="text-zinc-700 hover:text-zinc-400 transition-colors p-1"
              aria-label="Close command palette"
            >
              <X size={13} />
            </button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="py-1">
              {results.map((lab, i) => (
                <button
                  key={lab.id}
                  onClick={() => navigate(lab.id)}
                  className={cn(
                    "w-full flex flex-col items-start px-4 py-2.5 text-left",
                    "transition-colors duration-75",
                    i === selected
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-300 hover:bg-zinc-800/50"
                  )}
                >
                  <span
                    className="text-[13px] leading-snug"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {lab.piName}
                  </span>
                  <span className="text-[11px] text-zinc-600 mt-0.5">
                    {lab.labName}
                    <span className="text-zinc-800 mx-1.5">·</span>
                    {lab.department.replace("Department of ", "").replace("School of ", "")}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {query.trim() && results.length === 0 && (
            <div className="px-4 py-6 text-center">
              <p className="text-[12px] text-zinc-600">
                No results for{" "}
                <span className="text-zinc-400">"{query}"</span>
              </p>
              <p className="text-[11px] text-zinc-700 mt-1">
                Press ↵ to search all researchers
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-zinc-800/60">
            <span className="text-[11px] text-zinc-700">
              {query ? "" : `${labCount.toLocaleString()} researchers indexed`}
            </span>
            <div className="flex items-center gap-3 text-[10px] text-zinc-700">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-px bg-zinc-800 border border-zinc-700/60 rounded-[2px] font-mono text-zinc-500">
                  ↑↓
                </kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-px bg-zinc-800 border border-zinc-700/60 rounded-[2px] font-mono text-zinc-500">
                  ↵
                </kbd>
                open
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-px bg-zinc-800 border border-zinc-700/60 rounded-[2px] font-mono text-zinc-500">
                  esc
                </kbd>
                close
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
