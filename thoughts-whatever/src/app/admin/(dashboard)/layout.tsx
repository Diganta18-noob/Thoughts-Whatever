import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { LogoutButton } from "@/components/admin/logout-button";
import { AdminHeaderBrand, ViewSiteLink } from "@/components/admin/admin-header-chrome";

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
          <AdminHeaderBrand />
          <AdminNav />

          <div className="ml-auto flex items-center gap-4">
            <ViewSiteLink />
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</div>
    </div>
  );
}
