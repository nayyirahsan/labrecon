import { Skeleton } from "@/components/ui/skeleton";

export default function TrackerLoading() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-0 flex items-center justify-between h-[52px] px-8 bg-zinc-950 border-b border-zinc-800/60 shrink-0">
        <Skeleton className="h-4 w-24" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-3.5 w-14" />
          <Skeleton className="h-3.5 w-14" />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 px-8 py-6">
        {/* Header row */}
        <div className="flex gap-4 pb-3 border-b border-zinc-800/60 mb-1">
          <Skeleton className="h-[10px] flex-1" />
          <Skeleton className="h-[10px] w-[140px]" />
          <Skeleton className="h-[10px] w-[100px]" />
          <Skeleton className="h-[10px] w-[60px]" />
          <Skeleton className="h-[10px] w-[160px]" />
        </div>

        {/* Rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 py-3 border-b border-zinc-800/40"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex-1 flex flex-col gap-1.5 min-w-0">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-3 w-44" />
            </div>
            <Skeleton className="h-3 w-[120px] shrink-0" />
            <Skeleton className="h-5 w-[90px] rounded-[3px] shrink-0" />
            <Skeleton className="h-3 w-[52px] shrink-0" />
            <div className="flex items-center gap-1 shrink-0">
              <Skeleton className="h-7 w-20 rounded-[3px]" />
              <Skeleton className="h-7 w-7 rounded-[3px]" />
              <Skeleton className="h-7 w-7 rounded-[3px]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
