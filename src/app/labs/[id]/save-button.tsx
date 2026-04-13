"use client";

import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const SAVED_KEY = "labrecon:saved";

function getSaved(): Set<number> {
  try {
    return new Set(
      JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]") as number[]
    );
  } catch {
    return new Set();
  }
}

export function SaveButton({ labId }: { labId: number }) {
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSaved(getSaved().has(labId));
  }, [labId]);

  function toggle() {
    const ids = getSaved();
    if (ids.has(labId)) ids.delete(labId);
    else ids.add(labId);
    localStorage.setItem(SAVED_KEY, JSON.stringify([...ids]));
    setSaved(ids.has(labId));
  }

  return (
    <button
      onClick={toggle}
      disabled={!mounted}
      className={cn(
        "inline-flex items-center gap-2 h-10 px-4 rounded-[4px] text-[13px]",
        "border transition-all duration-100 disabled:opacity-40",
        saved
          ? "border-blue-500/40 text-blue-400 bg-blue-500/5 hover:bg-blue-500/10"
          : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
      )}
    >
      {saved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
      {saved ? "Saved" : "Save to Tracker"}
    </button>
  );
}
