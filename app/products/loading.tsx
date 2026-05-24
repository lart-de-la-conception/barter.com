function ProductSkeleton() {
  return (
    <div className="space-y-3">
      <div className="aspect-[4/5] animate-pulse rounded-[28px] bg-black/5" />
      <div className="h-4 w-1/2 animate-pulse rounded-full bg-black/5" />
      <div className="h-4 w-3/4 animate-pulse rounded-full bg-black/5" />
      <div className="h-4 w-24 animate-pulse rounded-full bg-black/5" />
    </div>
  );
}

export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div className="h-10 w-80 max-w-full animate-pulse rounded-xl bg-black/5" />
          <div className="h-4 w-[min(540px,80vw)] animate-pulse rounded-full bg-black/5" />
        </div>
        <div className="h-12 w-full max-w-sm animate-pulse rounded-full bg-black/5" />
      </div>
      <div className="mb-8 flex gap-2 overflow-hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-10 w-32 shrink-0 animate-pulse rounded-full bg-black/5" />
        ))}
      </div>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 9 }).map((_, index) => (
          <ProductSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
