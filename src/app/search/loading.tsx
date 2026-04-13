import { Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Search bar */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-5 h-[52px] bg-zinc-950 border-b border-zinc-800/60">
        <Skeleton className="size-3.5 rounded-full shrink-0" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>

      {/* Body */}
      <div className="flex flex-1">
        {/* Filter sidebar — desktop only */}
        <aside className="hidden md:block w-[232px] shrink-0 border-r border-zinc-800/60 p-5 pt-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-[10px] w-14" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-[10px] w-20" />
              <Skeleton className="h-8 w-full rounded-[3px]" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-[10px] w-12" />
              <div className="flex flex-col gap-0.5">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-7 w-full rounded-[3px]" />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-[10px] w-24" />
              <div className="flex flex-col gap-0.5">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-7 w-full rounded-[3px]" />
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 px-4 md:px-6 py-5 min-w-0">
          <Skeleton className="h-[11px] w-32 mb-4" />
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="px-5 py-4 bg-zinc-900 border border-zinc-800 rounded-[4px] flex flex-col gap-3"
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
                <div className="flex flex-wrap gap-1">
                  {[52, 68, 44, 60, 48].map((w) => (
                    <Skeleton key={w} className="h-5 rounded-[3px]" style={{ width: w }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
