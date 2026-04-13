import { Skeleton } from "@/components/ui/skeleton";

function SectionLabel() {
  return <Skeleton className="h-[10px] w-36 mb-5" />;
}

function Rule() {
  return <div className="h-px bg-zinc-800/60 my-8" />;
}

export default function LabLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
      {/* Breadcrumb */}
      <Skeleton className="h-[11px] w-20 mb-10" />

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-6 mb-8">
        <div className="flex flex-col gap-2.5 flex-1">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-3.5 w-56" />
          <Skeleton className="h-3.5 w-64" />
          <Skeleton className="h-3 w-40 mt-1" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      <Rule />

      {/* ── Research Summary ───────────────────────────────────── */}
      <div className="mb-8">
        <SectionLabel />
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[78%]" />
        </div>
      </div>

      <Rule />

      {/* ── Publications ───────────────────────────────────────── */}
      <div className="mb-8">
        <SectionLabel />
        {[1, 2, 3].map((i) => (
          <div key={i} className="py-4 border-t border-zinc-800/50 first:border-t-0">
            <div className="flex items-start justify-between gap-4">
              <Skeleton className="h-3.5 w-[68%]" />
              <Skeleton className="h-3 w-10 shrink-0" />
            </div>
            <Skeleton className="h-3 w-48 mt-2" />
          </div>
        ))}
      </div>

      <Rule />

      {/* ── Grants ─────────────────────────────────────────────── */}
      <div className="mb-8">
        <SectionLabel />
        {[1, 2].map((i) => (
          <div key={i} className="py-4 border-t border-zinc-800/50 first:border-t-0">
            <div className="flex items-start justify-between gap-4">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-20 shrink-0" />
            </div>
            <Skeleton className="h-3 w-[70%] mt-2" />
          </div>
        ))}
      </div>

      <Rule />

      {/* ── Skills ─────────────────────────────────────────────── */}
      <div className="mb-8">
        <SectionLabel />
        <div className="flex flex-wrap gap-2">
          {[80, 56, 68, 44, 72, 60].map((w) => (
            <Skeleton key={w} className="h-6 rounded-[3px]" style={{ width: `${w}px` }} />
          ))}
        </div>
      </div>

      <Rule />

      {/* ── CTAs ───────────────────────────────────────────────── */}
      <div className="flex gap-3 mb-16">
        <Skeleton className="h-10 w-52 rounded-[4px]" />
        <Skeleton className="h-10 w-40 rounded-[4px]" />
      </div>

      {/* ── Similar Labs ───────────────────────────────────────── */}
      <Rule />
      <SectionLabel />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 bg-zinc-900 border border-zinc-800 rounded-[4px] flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-[85%]" />
          </div>
        ))}
      </div>
    </div>
  );
}
