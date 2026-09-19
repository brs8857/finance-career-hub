/** Tiny inline trend line. Decorative: the numbers next to it carry the meaning. */
export function Sparkline({
  values,
  width = 96,
  height = 28,
  direction,
  className = "",
}: {
  values: number[];
  width?: number;
  height?: number;
  direction: "up" | "down" | "flat";
  className?: string;
}) {
  if (values.length < 2) {
    return <span aria-hidden className={`inline-block text-xs text-muted ${className}`} style={{ width }} />;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 2;
  const points = values
    .map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (width - pad * 2);
      const y = pad + (1 - (v - min) / span) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const stroke = direction === "up" ? "var(--up)" : direction === "down" ? "var(--down)" : "var(--muted)";

  return (
    <svg
      aria-hidden
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`shrink-0 overflow-visible ${className}`}
    >
      <polyline points={points} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
