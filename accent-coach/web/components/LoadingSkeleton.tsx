export function LoadingSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
      <div className="space-y-4">
        <SkeletonCard className="h-32" />
        <SkeletonCard className="h-40" />
        <SkeletonCard className="h-40" />
      </div>
      <div className="space-y-4">
        <SkeletonCard className="h-60" />
        <SkeletonCard className="h-40" />
      </div>
    </div>
  );
}

function SkeletonCard({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-3xl bg-slate-200/60 ${className}`} />;
}
