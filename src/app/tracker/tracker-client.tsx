"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BookMarked, Check, ChevronDown, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { TrackerStatus } from "@/lib/db/schema";

// ── Types ─────────────────────────────────────────────────────────────────────

type LabInfo = {
  id: number;
  piName: string;
  department: string;
  college: string;
  labName: string;
};

type LocalEntry = {
  labId: number;
  status: TrackerStatus;
  lastUpdated: string; // ISO
  dateSent: string | null;
};

// ── Storage ───────────────────────────────────────────────────────────────────

const TRACKER_KEY = "labrecon:tracker";
const SAVED_KEY = "labrecon:saved";

function readEntries(validIds: Set<number>): LocalEntry[] {
  try {
    const tracker: LocalEntry[] = JSON.parse(
      localStorage.getItem(TRACKER_KEY) ?? "[]"
    );
    const trackedIds = new Set(tracker.map((e) => e.labId));

    // Merge legacy labrecon:saved IDs not yet in tracker
    const legacyIds: number[] = JSON.parse(
      localStorage.getItem(SAVED_KEY) ?? "[]"
    );
    for (const id of legacyIds) {
      if (!trackedIds.has(id) && validIds.has(id)) {
        tracker.push({
          labId: id,
          status: "saved",
          lastUpdated: new Date().toISOString(),
          dateSent: null,
        });
        trackedIds.add(id);
      }
    }

    return tracker.filter((e) => validIds.has(e.labId));
  } catch {
    return [];
  }
}

function persistEntries(entries: LocalEntry[]) {
  localStorage.setItem(TRACKER_KEY, JSON.stringify(entries));
  // Keep labrecon:saved in sync so save buttons on cards stay accurate
  localStorage.setItem(
    SAVED_KEY,
    JSON.stringify(entries.map((e) => e.labId))
  );
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_ORDER: TrackerStatus[] = [
  "saved",
  "sent",
  "responded",
  "no_response",
  "meeting",
];

const STATUS_CONFIG: Record<
  TrackerStatus,
  { label: string; dot: string; badge: string }
> = {
  saved: {
    label: "Saved",
    dot: "bg-blue-500",
    badge: "text-blue-400 bg-blue-500/10 border-blue-500/25",
  },
  sent: {
    label: "Sent",
    dot: "bg-amber-500",
    badge: "text-amber-400 bg-amber-500/10 border-amber-500/25",
  },
  responded: {
    label: "Responded",
    dot: "bg-emerald-500",
    badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
  },
  no_response: {
    label: "No Response",
    dot: "bg-zinc-600",
    badge: "text-zinc-500 bg-zinc-800/60 border-zinc-700/50",
  },
  meeting: {
    label: "Meeting",
    dot: "bg-purple-500",
    badge: "text-purple-400 bg-purple-500/10 border-purple-500/25",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function StatusBadge({ status }: { status: TrackerStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5",
        "rounded-[3px] text-[11px] border whitespace-nowrap",
        cfg.badge
      )}
    >
      <span className={cn("size-[5px] rounded-full shrink-0", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-5">
      <div className="size-12 flex items-center justify-center rounded-full bg-zinc-900 border border-zinc-800">
        <BookMarked size={18} className="text-zinc-700" />
      </div>
      <div className="text-center">
        <p className="text-[14px] text-zinc-400">No labs tracked yet.</p>
        <p className="text-[12px] text-zinc-700 mt-1">
          Start by searching for a lab to save.
        </p>
      </div>
      <Link
        href="/search"
        className={cn(
          "inline-flex items-center gap-1.5 h-8 px-4 rounded-[4px]",
          "text-[12px] border border-zinc-700 text-zinc-400",
          "hover:border-zinc-500 hover:text-zinc-200 transition-colors duration-100"
        )}
      >
        Search Labs <ArrowUpRight size={12} />
      </Link>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

type Props = { allLabs: LabInfo[] };

export function TrackerClient({ allLabs }: Props) {
  const [entries, setEntries] = useState<LocalEntry[]>([]);
  const [mounted, setMounted] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const labMap = new Map(allLabs.map((l) => [l.id, l]));
  const validIds = new Set(allLabs.map((l) => l.id));

  useEffect(() => {
    setEntries(readEntries(validIds));
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStatus = useCallback(
    (labId: number, status: TrackerStatus) => {
      setEntries((prev) => {
        const next = prev.map((e) =>
          e.labId === labId
            ? {
                ...e,
                status,
                lastUpdated: new Date().toISOString(),
                dateSent:
                  status === "sent" && !e.dateSent
                    ? new Date().toISOString()
                    : e.dateSent,
              }
            : e
        );
        persistEntries(next);
        return next;
      });
    },
    []
  );

  const removeEntry = useCallback((labId: number) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.labId !== labId);
      persistEntries(next);
      return next;
    });
    setConfirmDelete(null);
  }, []);

  function handleDeleteClick(labId: number) {
    if (confirmDelete === labId) {
      removeEntry(labId);
    } else {
      setConfirmDelete(labId);
      setTimeout(() => setConfirmDelete((v) => (v === labId ? null : v)), 3500);
    }
  }

  // Summary counts
  const counts = STATUS_ORDER.reduce(
    (acc, s) => {
      acc[s] = entries.filter((e) => e.status === s).length;
      return acc;
    },
    {} as Record<TrackerStatus, number>
  );

  const summaryItems = STATUS_ORDER.filter((s) => counts[s] > 0).map((s) => ({
    status: s,
    count: counts[s],
    ...STATUS_CONFIG[s],
  }));

  // Sort: by lastUpdated desc
  const rows = [...entries].sort(
    (a, b) =>
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
  );

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 flex items-center justify-between h-[52px] px-4 sm:px-8 bg-zinc-950 border-b border-zinc-800/60 shrink-0">
        <h1
          className="text-[16px] text-zinc-100"
          style={{ fontFamily: "var(--font-display)" }}
        >
          My Tracker
        </h1>

        {mounted && summaryItems.length > 0 && (
          <div className="flex items-center gap-4">
            {summaryItems.map((item, i) => (
              <span key={item.status} className="flex items-center gap-1.5">
                {i > 0 && (
                  <span className="text-zinc-800 mr-2 select-none">·</span>
                )}
                <span
                  className={cn("size-[6px] rounded-full", item.dot)}
                />
                <span className="text-[12px] text-zinc-500 tabular-nums">
                  {item.count}
                </span>
                <span className="text-[12px] text-zinc-700">{item.label}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div className="flex-1 px-4 sm:px-8 py-6">
        {!mounted ? null : rows.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto -mx-4 px-4 sm:-mx-8 sm:px-8">
          <table className="w-full table-fixed min-w-[640px]">
            <colgroup>
              <col /> {/* Lab/PI — auto */}
              <col style={{ width: 180 }} />
              <col style={{ width: 120 }} />
              <col style={{ width: 80 }} />
              <col style={{ width: 200 }} />
            </colgroup>

            {/* Header */}
            <thead>
              <tr className="border-b border-zinc-800/60">
                {["Lab / PI", "Department", "Status", "Date", "Action"].map(
                  (h) => (
                    <th
                      key={h}
                      className={cn(
                        "pb-3 text-left",
                        "text-[10px] uppercase tracking-[0.12em] text-zinc-700 font-normal"
                      )}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>

            {/* Rows */}
            <tbody>
              {rows.map((entry, i) => {
                const lab = labMap.get(entry.labId);
                if (!lab) return null;
                const isConfirming = confirmDelete === entry.labId;

                return (
                  <tr
                    key={entry.labId}
                    className={cn(
                      "border-b border-zinc-800/40 animate-fade-up",
                      "hover:bg-zinc-900/40 transition-colors duration-75 group"
                    )}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    {/* Lab/PI */}
                    <td className="py-3 pr-4">
                      <Link
                        href={`/labs/${lab.id}`}
                        className="block group/link"
                      >
                        <p
                          className="text-[13px] text-zinc-200 group-hover/link:text-blue-400 transition-colors duration-100 leading-snug truncate"
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          {lab.piName}
                        </p>
                        <p className="text-[11px] text-zinc-600 truncate mt-0.5">
                          {lab.labName}
                        </p>
                      </Link>
                    </td>

                    {/* Department */}
                    <td className="py-3 pr-4">
                      <p className="text-[12px] text-zinc-600 truncate">
                        {lab.department.replace("Department of ", "")}
                      </p>
                    </td>

                    {/* Status badge */}
                    <td className="py-3 pr-4">
                      <StatusBadge status={entry.status} />
                    </td>

                    {/* Date */}
                    <td className="py-3 pr-4">
                      <span className="text-[12px] text-zinc-700 tabular-nums whitespace-nowrap">
                        {formatDate(entry.lastUpdated)}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        {/* Status dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            aria-label={`Change status for ${lab.piName}`}
                            className={cn(
                              "inline-flex items-center gap-1.5 h-7 px-2 rounded-[3px]",
                              "text-[11px] text-zinc-500 hover:text-zinc-200",
                              "border border-transparent hover:border-zinc-700",
                              "transition-all duration-100 cursor-pointer"
                            )}
                          >
                            <ChevronDown size={11} />
                            Set status
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            side="bottom"
                            align="start"
                            className="min-w-[160px] bg-zinc-900 border-zinc-800"
                          >
                            {STATUS_ORDER.map((s) => {
                              const cfg = STATUS_CONFIG[s];
                              const active = entry.status === s;
                              return (
                                <DropdownMenuItem
                                  key={s}
                                  onClick={() => updateStatus(entry.labId, s)}
                                  className={cn(
                                    "flex items-center gap-2 text-[12px] cursor-pointer",
                                    active
                                      ? "text-zinc-200"
                                      : "text-zinc-400"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "size-[6px] rounded-full shrink-0",
                                      cfg.dot
                                    )}
                                  />
                                  {cfg.label}
                                  {active && (
                                    <Check
                                      size={11}
                                      className="ml-auto text-blue-400"
                                    />
                                  )}
                                </DropdownMenuItem>
                              );
                            })}
                            <DropdownMenuSeparator className="bg-zinc-800" />
                            <DropdownMenuItem
                              onClick={() => removeEntry(entry.labId)}
                              className="text-[12px] text-red-500/80 cursor-pointer hover:text-red-400"
                            >
                              Remove from tracker
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {/* View profile */}
                        <Link
                          href={`/labs/${lab.id}`}
                          aria-label={`View ${lab.piName}'s lab profile`}
                          className={cn(
                            "inline-flex items-center justify-center",
                            "size-7 rounded-[3px]",
                            "text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800",
                            "transition-colors duration-100"
                          )}
                        >
                          <ArrowUpRight size={13} />
                        </Link>

                        {/* Delete with confirm */}
                        <button
                          onClick={() => handleDeleteClick(entry.labId)}
                          aria-label={isConfirming ? "Confirm removal" : `Remove ${lab.piName} from tracker`}
                          className={cn(
                            "inline-flex items-center justify-center gap-1",
                            "h-7 rounded-[3px] transition-all duration-100",
                            isConfirming
                              ? "px-2 text-[11px] font-medium text-red-400 bg-red-500/10 border border-red-500/25 hover:bg-red-500/20"
                              : "size-7 text-zinc-700 hover:text-zinc-400 hover:bg-zinc-800"
                          )}
                        >
                          {isConfirming ? (
                            "Confirm?"
                          ) : (
                            <Trash2 size={12} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Footer — total count */}
      {mounted && rows.length > 0 && (
        <div className="px-4 sm:px-8 py-3 border-t border-zinc-800/40">
          <span className="text-[11px] text-zinc-800">
            {rows.length} lab{rows.length !== 1 ? "s" : ""} tracked
          </span>
        </div>
      )}
    </div>
  );
}
