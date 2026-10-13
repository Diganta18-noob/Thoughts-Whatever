export default function BlogLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 pb-24 sm:px-6">
      {/* Header Skeleton */}
      <div className="border-b border-rule py-12 space-y-4">
        <div className="h-4 w-24 rounded bg-content/10" />
        <div className="h-10 w-48 rounded bg-content/10" />
        <div className="h-5 w-96 max-w-full rounded bg-content/5" />
      </div>

      {/* Main Content + Sidebar Layout Skeleton */}
      <div className="grid gap-10 py-12 lg:grid-cols-[1fr_18rem] lg:gap-16">
        <div className="divide-y divide-rule space-y-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="pt-8 first:pt-0 space-y-4">
              <div className="h-4 w-1/4 rounded bg-content/10" />
              <div className="h-7 w-3/4 rounded bg-content/10" />
              <div className="h-16 w-full rounded bg-content/5" />
            </div>
          ))}
        </div>
        <div className="hidden lg:block space-y-4 border border-rule p-6 rounded-sm">
          <div className="h-4 w-1/2 rounded bg-content/10" />
          <div className="h-20 w-full rounded bg-content/5" />
          <div className="h-10 w-full rounded bg-content/10" />
        </div>
      </div>
    </div>
  );
}
