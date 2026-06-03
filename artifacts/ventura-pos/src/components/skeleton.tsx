interface SkeletonProps {
  className?: string;
  rounded?: string;
  height?: string | number;
  width?: string | number;
}

export function Skeleton({ className, rounded = "0.75rem", height, width }: SkeletonProps) {
  return (
    <div
      className={`shimmer ${className ?? ""}`}
      style={{
        borderRadius: rounded,
        height: typeof height === "number" ? `${height}px` : height,
        width: typeof width === "number" ? `${width}px` : width,
      }}
    />
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={12}
          width={i === lines - 1 ? "60%" : "100%"}
          rounded="6px"
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-white/5 p-4 space-y-3 ${className ?? ""}`}
      style={{ background: "rgba(255,255,255,0.02)" }}
    >
      <div className="flex items-center gap-3">
        <Skeleton height={44} width={44} rounded="12px" />
        <div className="flex-1 space-y-2">
          <Skeleton height={14} width="60%" rounded="4px" />
          <Skeleton height={10} width="40%" rounded="4px" />
        </div>
      </div>
      <Skeleton height={80} rounded="12px" />
      <div className="flex gap-2">
        <Skeleton height={28} width={70} rounded="999px" />
        <Skeleton height={28} width={90} rounded="999px" />
      </div>
    </div>
  );
}
