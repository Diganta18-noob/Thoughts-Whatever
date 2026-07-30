import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { LogoutButton } from "@/components/admin/logout-button";

/**
 * The auth gate for everything in the (dashboard) group.
 *
 * It is a layout rather than middleware because `jsonwebtoken` needs Node's
 * crypto and Next middleware runs on the edge runtime. A layout also has the
 * database at hand, so the session is checked against a real AdminUser row —
 * a valid signature for a deleted account does not get in.
 */

export const metadata: Metadata = {
  title: { default: "Editor", template: "%s — Editor" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-30 border-b border-rule bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <Link
            href="/admin"
            className="font-display text-lg text-content"
            lang="bn"
          >
            সম্পাদকের ঘর
          </Link>

          <AdminNav />

          <div className="ml-auto flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="font-serif text-sm text-content-soft transition hover:text-accent"
              lang="en"
            >
              View site
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</div>
    </div>
  );
}
