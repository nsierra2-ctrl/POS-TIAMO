interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
}

export function Sparkline({
  data,
  color = "#FF2D2D",
  width = 80,
  height = 24,
  fill = true,
  className,
}: SparklineProps) {
  if (data.length === 0) {
    return <svg width={width} height={height} className={className} aria-hidden="true" />;
  }
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = data.length > 1 ? width / (data.length - 1) : width;
  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 2) - 1;
    return [x, y] as const;
  });
  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${path} L${width.toFixed(1)},${height} L0,${height} Z`;

  const last = points[points.length - 1]!;
  const id = `spk-${color.replace("#", "")}`;

  return (
    <svg width={width} height={height} className={className} aria-hidden="true" overflow="visible">
      {fill && (
        <>
          <defs>
            <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity="0.32" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${id})`} />
        </>
      )}
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2" fill={color}>
        <animate attributeName="r" values="2;3;2" dur="1.6s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
