export default function Loading() {
  return (
    <div className="min-h-screen animate-pulse">
      {/* Hero Skeleton */}
      <div className="flex min-h-[100svh] items-center justify-center px-4">
        <div className="w-full max-w-2xl space-y-8 text-center">
          <div className="mx-auto h-3 w-32 rounded bg-content/10" />
          <div className="mx-auto h-24 w-full rounded bg-content/10" />
          <div className="mx-auto h-16 w-3/4 rounded bg-content/5" />
          <div className="flex justify-center gap-3">
            <div className="h-11 w-32 rounded-sm bg-content/10" />
            <div className="h-11 w-32 rounded-sm bg-content/10" />
            <div className="h-11 w-32 rounded-sm bg-content/10" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Featured Series Skeleton */}
        <div className="space-y-8 py-16">
          <div className="h-6 w-48 rounded bg-content/10" />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-[3/4] w-full rounded-sm bg-content/5" />
                <div className="h-5 w-3/4 rounded bg-content/10" />
                <div className="h-3 w-1/2 rounded bg-content/5" />
              </div>
            ))}
          </div>
        </div>

        {/* Latest Episodes Skeleton */}
        <div className="space-y-8 py-16">
          <div className="h-6 w-48 rounded bg-content/10" />
          <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-4">
              <div className="aspect-[4/3] w-full rounded-sm bg-content/5" />
              <div className="h-5 w-3/4 rounded bg-content/10" />
            </div>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="aspect-[3/4] w-24 shrink-0 rounded-sm bg-content/5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-full rounded bg-content/10" />
                    <div className="h-3 w-2/3 rounded bg-content/5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Categories, Timeline, Archive, Authors Skeleton */}
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-6 py-16">
            <div className="h-6 w-48 rounded bg-content/10" />
            <div className="h-32 w-full rounded bg-content/5" />
          </div>
        ))}
      </div>

      {/* Quote Skeleton */}
      <div className="flex min-h-[70svh] items-center justify-center py-24">
        <div className="mx-auto max-w-4xl space-y-6 px-4 text-center">
          <div className="mx-auto h-8 w-3/4 rounded bg-content/10" />
          <div className="mx-auto h-8 w-full rounded bg-content/10" />
          <div className="mx-auto h-8 w-2/3 rounded bg-content/10" />
        </div>
      </div>

      {/* Newsletter Skeleton */}
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="space-y-6 border-t border-rule pt-14">
          <div className="h-6 w-48 rounded bg-content/10" />
          <div className="h-12 w-full max-w-md rounded-sm bg-content/5" />
        </div>
      </div>
    </div>
  );
}
