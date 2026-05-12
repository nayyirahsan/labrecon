"use client";

import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { createBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth-provider";

export function SaveButton({ labId }: { labId: string }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!user) {
      setMounted(true);
      return;
    }
    const supabase = createBrowserClient();
    supabase
      .from("tracker_entries")
      .select("id")
      .eq("researcher_id", labId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setSaved(!!data);
        setMounted(true);
      });
  }, [labId, user]);

  async function toggle() {
    if (!user) return;
    const supabase = createBrowserClient();
    if (saved) {
      await supabase
        .from("tracker_entries")
        .delete()
        .eq("researcher_id", labId)
        .eq("user_id", user.id);
      setSaved(false);
    } else {
      await supabase
        .from("tracker_entries")
        .insert({ researcher_id: labId, user_id: user.id, status: "saved" });
      setSaved(true);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={!mounted}
      className={cn(
        "inline-flex items-center gap-2 h-10 px-4 rounded-[4px] text-[13px]",
        "border transition-[border-color,background-color,color] duration-100 disabled:opacity-40",
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
