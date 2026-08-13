export default function Loading() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-4">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      <span className="font-mono text-xs text-content-soft tracking-wider uppercase">
        Loading...
      </span>
    </div>
  );
}
