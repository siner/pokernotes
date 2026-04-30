interface SkeletonCardProps {
  /** Number of placeholder cards to render */
  count?: number;
  /** Approximate height of each card — matches PlayerCard / HandCard rhythm */
  variant?: 'player' | 'hand' | 'note';
}

/**
 * Lightweight loading skeleton for card lists. Matches the visual rhythm of
 * the real cards so the layout doesn't jump when data arrives. Respects
 * `prefers-reduced-motion` via the `motion-safe:` Tailwind prefix.
 */
export function SkeletonCard({ count = 3, variant = 'player' }: SkeletonCardProps) {
  return (
    <div className="flex flex-col gap-2" role="status" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="motion-safe:animate-pulse rounded-xl border border-slate-800 bg-slate-900/40 p-4"
        >
          {variant === 'player' && <PlayerSkeleton />}
          {variant === 'hand' && <HandSkeleton />}
          {variant === 'note' && <NoteSkeleton />}
        </div>
      ))}
    </div>
  );
}

function Bar({ className = '' }: { className?: string }) {
  return <div className={`rounded bg-slate-800 ${className}`} />;
}

function PlayerSkeleton() {
  return (
    <div className="flex items-start gap-4">
      <div className="h-10 w-10 shrink-0 rounded-full bg-slate-800" />
      <div className="flex-1 space-y-2">
        <Bar className="h-4 w-1/3" />
        <div className="flex gap-1.5">
          <Bar className="h-4 w-12" />
          <Bar className="h-4 w-14" />
          <Bar className="h-4 w-10" />
        </div>
        <Bar className="h-3 w-1/2" />
      </div>
    </div>
  );
}

function HandSkeleton() {
  return (
    <div className="space-y-2">
      <Bar className="h-4 w-3/4" />
      <Bar className="h-3 w-1/2" />
      <div className="flex gap-1.5">
        <Bar className="h-4 w-10" />
        <Bar className="h-4 w-14" />
        <Bar className="h-4 w-12" />
      </div>
    </div>
  );
}

function NoteSkeleton() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Bar className="h-3 w-16" />
        <Bar className="h-3 w-20" />
      </div>
      <Bar className="h-4 w-full" />
      <Bar className="h-4 w-5/6" />
    </div>
  );
}
