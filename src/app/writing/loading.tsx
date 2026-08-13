export default function WritingLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 pb-24 sm:px-6">
      {/* Header Skeleton */}
      <div className="border-b border-rule py-12 space-y-4">
        <div className="h-4 w-24 rounded bg-content/10" />
        <div className="h-10 w-48 rounded bg-content/10" />
        <div className="h-5 w-96 max-w-full rounded bg-content/5" />
      </div>

      {/* Featured Lead Card Skeleton */}
      <div className="border-b border-rule py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="aspect-[4/3] w-full rounded-sm bg-content/5" />
          <div className="space-y-4 justify-center flex flex-col">
            <div className="h-4 w-32 rounded bg-content/10" />
            <div className="h-8 w-3/4 rounded bg-content/10" />
            <div className="h-16 w-full rounded bg-content/5" />
          </div>
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-4">
            <div className="aspect-[4/3] w-full rounded-sm bg-content/5" />
            <div className="h-4 w-1/3 rounded bg-content/10" />
            <div className="h-6 w-5/6 rounded bg-content/10" />
            <div className="h-12 w-full rounded bg-content/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
