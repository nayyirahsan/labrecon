"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth-provider";

export function SaveButton({ labId }: { labId: string }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [saved, setSaved] = useState(false);
  const [checkDone, setCheckDone] = useState(false);
  const [pending, setPending] = useState(false);

  const mounted = !authLoading && (!user || checkDone);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    const supabase = createBrowserClient();
    supabase
      .from("tracker_entries")
      .select("id")
      .eq("researcher_id", labId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setSaved(!!data);
        setCheckDone(true);
      });
    return () => { cancelled = true; };
  }, [labId, user, authLoading]);

  async function toggle() {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/labs/${labId}`)}`);
      return;
    }

    setPending(true);
    const supabase = createBrowserClient();

    if (saved) {
      const { error } = await supabase
        .from("tracker_entries")
        .delete()
        .eq("researcher_id", labId)
        .eq("user_id", user.id);
      if (error) {
        toast.error("Failed to remove from tracker.");
      } else {
        setSaved(false);
      }
    } else {
      const { error } = await supabase
        .from("tracker_entries")
        .insert({ researcher_id: labId, user_id: user.id, status: "saved" });
      if (error) {
        toast.error("Failed to save lab. Please try again.");
      } else {
        setSaved(true);
        toast.success("Lab saved to tracker.", {
          action: {
            label: "View Tracker",
            onClick: () => router.push("/tracker"),
          },
        });
      }
    }

    setPending(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={!mounted || pending}
      className={cn(
        "inline-flex items-center gap-2 h-10 px-4 rounded-[4px] text-[13px]",
        "border transition-[border-color,background-color,color] duration-100 disabled:opacity-40",
        saved
          ? "border-blue-500/40 text-blue-400 bg-blue-500/5 hover:bg-blue-500/10"
          : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
      )}
    >
      {pending ? (
        <Loader2 size={13} className="animate-spin" />
      ) : saved ? (
        <BookmarkCheck size={13} />
      ) : (
        <Bookmark size={13} />
      )}
      {saved ? "Saved" : "Save to Tracker"}
    </button>
  );
}
