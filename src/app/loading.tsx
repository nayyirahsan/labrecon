import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="flex flex-col min-h-full">
      {/* ── Hero ── */}
      <section className="flex flex-col items-center justify-center min-h-[46vh] px-8 pt-16 pb-10">
        <div className="w-full max-w-2xl flex flex-col items-center gap-7">
          <Skeleton className="h-[11px] w-48 rounded-sm" />

          <div className="flex flex-col items-center gap-2.5 w-full">
            <Skeleton className="h-12 w-[80%] max-w-md" />
            <Skeleton className="h-12 w-[60%] max-w-sm" />
          </div>

          <Skeleton className="h-px w-full max-w-[36rem]" />
          <Skeleton className="h-[52px] w-full rounded-[4px]" />
          <Skeleton className="h-[11px] w-64" />
        </div>
      </section>

      {/* ── Stat strip ── */}
      <section className="px-8 pb-14">
        <div className="max-w-2xl mx-auto flex gap-px bg-zinc-800/40 rounded-[4px] overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-2 py-7 bg-zinc-950"
            >
              <Skeleton className="h-9 w-10" />
              <Skeleton className="h-[10px] w-20" />
            </div>
          ))}
        </div>
      </section>

      {/* ── Active Labs ── */}
      <section className="flex-1 px-8 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-[10px] w-20" />
            <Skeleton className="h-[10px] w-12" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-zinc-800/30 rounded-[4px] overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-zinc-950 p-5 flex flex-col gap-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-[11px] w-44" />
                  </div>
                  <Skeleton className="size-[7px] rounded-full mt-1 shrink-0" />
                </div>
                <Skeleton className="h-[11px] w-28" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-[85%]" />
                </div>
                <div className="flex flex-wrap gap-1 mt-auto">
                  {[52, 64, 44, 56].map((w) => (
                    <Skeleton key={w} className="h-5 rounded-[3px]" style={{ width: w }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
