/**
 * The documentary section runs on the dark archive surface.
 *
 * `data-surface="archive"` overrides the reading-theme variables for
 * everything inside, so no component below needs a dark-mode branch — they are
 * all written against `--surface` / `--content` / `--accent` already. A reader
 * who has chosen night mode sees no change at all, which is the point: this is
 * the section's identity, not a second theme system.
 */
export default function DocumentaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface text-content">
      {children}
    </div>
  );
}
