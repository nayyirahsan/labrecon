"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchForm() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <Search
        size={15}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none"
        aria-hidden="true"
      />
      <input
        type="text"
        name="q"
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search labs, PIs, research areas, techniques…"
        aria-label="Search labs"
        className={cn(
          "w-full h-[52px] pl-11 pr-4",
          "bg-zinc-900 border border-zinc-800",
          "rounded-[4px] text-sm text-zinc-100",
          "placeholder:text-zinc-600",
          "outline-none focus:border-zinc-600",
          "transition-colors duration-100"
        )}
      />
    </form>
  );
}
