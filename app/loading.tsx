function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-[28px] bg-black/5 ${className}`} />;
}

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <SkeletonBlock className="h-3 w-40 rounded-full" />
          <SkeletonBlock className="h-12 w-72 rounded-xl" />
          <SkeletonBlock className="h-4 w-[min(520px,80vw)] rounded-full" />
        </div>
        <SkeletonBlock className="h-12 w-full max-w-sm rounded-full" />
      </div>
      <div className="mb-8 flex gap-3 overflow-hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-10 w-32 shrink-0 rounded-full" />
        ))}
      </div>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <SkeletonBlock className="aspect-[4/5] w-full" />
            <SkeletonBlock className="h-4 w-1/2 rounded-full" />
            <SkeletonBlock className="h-4 w-3/4 rounded-full" />
            <SkeletonBlock className="h-4 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
