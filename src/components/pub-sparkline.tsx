// Sparkline showing publication counts per year for the last 6 years.
// Server-safe — no client-side hooks needed.

type Props = {
  years: number[];
  width?: number;
  height?: number;
};

export function PubSparkline({ years, width = 88, height = 26 }: Props) {
  const currentYear = new Date().getFullYear();
  const yearRange = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i);
  const counts = yearRange.map((y) => years.filter((yr) => yr === y).length);
  const max = Math.max(...counts, 1);
  const normalized = counts.map((c) => c / max);

  const pad = 3;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  const points = normalized.map((n, i) => {
    const x = pad + (i / (normalized.length - 1)) * innerW;
    const y = pad + (1 - n) * innerH;
    return { x, y, active: counts[i] > 0 };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      aria-hidden="true"
    >
      <path
        d={pathD}
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-blue-500/40"
      />
      {points.map((p, i) =>
        p.active ? (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === points.length - 1 ? 2.5 : 1.5}
            className={i === points.length - 1 ? "fill-blue-500" : "fill-blue-500/60"}
          />
        ) : (
          <circle key={i} cx={p.x} cy={p.y} r={1} className="fill-zinc-700/60" />
        )
      )}
    </svg>
  );
}
