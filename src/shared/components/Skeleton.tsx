interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse bg-zinc-200 rounded ${className}`} />;
}

export function SkeletonTableRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-3">
          <div className="h-4 animate-pulse bg-zinc-200 rounded" />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonCard() {
  return (
    <div className="p-4 space-y-2 border-b border-zinc-100">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1.5 flex-1">
          <div className="h-4 animate-pulse bg-zinc-200 rounded w-2/3" />
          <div className="h-3 animate-pulse bg-zinc-100 rounded w-1/2" />
        </div>
        <div className="h-5 w-12 animate-pulse bg-zinc-200 rounded" />
      </div>
      <div className="h-3.5 animate-pulse bg-zinc-100 rounded w-1/3" />
    </div>
  );
}
