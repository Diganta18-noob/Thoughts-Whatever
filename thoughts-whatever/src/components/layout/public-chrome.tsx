"use client";

import { usePathname } from "next/navigation";

/**
 * Hides the public header and footer inside /admin.
 *
 * The alternative is a `(site)` route group wrapping every public page so the
 * admin can sit outside it — a lot of files moved to solve one conditional.
 * This keeps the reader-facing tree exactly where it reads best and pays for it
 * with one client component that renders nothing on admin routes.
 */
export function PublicChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <>{children}</>;
}
