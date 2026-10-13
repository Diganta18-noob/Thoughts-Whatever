export default function ArchiveLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 pb-24 sm:px-6">
      <div className="border-b border-rule py-12 space-y-4">
        <div className="h-4 w-24 rounded bg-content/10" />
        <div className="h-10 w-48 rounded bg-content/10" />
        <div className="h-5 w-96 max-w-full rounded bg-content/5" />
      </div>

      <div className="grid gap-10 py-10 lg:grid-cols-[16rem_1fr] lg:gap-14">
        <div className="space-y-6 hidden lg:block">
          <div className="h-6 w-32 rounded bg-content/10" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-7 w-20 rounded bg-content/5" />
            ))}
          </div>
          <div className="h-6 w-32 rounded bg-content/10" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-7 w-24 rounded bg-content/5" />
            ))}
          </div>
        </div>

        <div className="divide-y divide-rule space-y-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="pt-6 flex justify-between items-center">
              <div className="space-y-2 flex-1">
                <div className="h-5 w-2/3 rounded bg-content/10" />
                <div className="h-3 w-1/3 rounded bg-content/5" />
              </div>
              <div className="h-4 w-16 rounded bg-content/5 ml-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
