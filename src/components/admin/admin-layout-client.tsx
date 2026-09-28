"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_GROUPS, resolveActiveHref } from "@/lib/admin-nav";
import { AdminHeaderBrand, AdminHeaderActions } from "@/components/admin/admin-header-chrome";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { LogoutButton } from "@/components/admin/logout-button";
import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";

interface AdminLayoutClientProps {
  adminEmail: string;
  adminRole: string;
  children: React.ReactNode;
}

export function AdminLayoutClient({
  adminEmail,
  adminRole,
  children,
}: AdminLayoutClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname() ?? "/admin";
  const activeHref = resolveActiveHref(pathname, { visibleOnly: true });
  const currentGroup = ADMIN_NAV_GROUPS.find((group) => group.items.some((item) => item.href === activeHref));
  const currentPage = currentGroup?.items.find((item) => item.href === activeHref)?.label ?? "Workspace";

  useBodyScrollLock(mobileMenuOpen);

  // The drawer covers the page but the page kept its keyboard affordances:
  // Escape did nothing, so dismissing it meant finding the backdrop or the X.
  useEffect(() => {
    if (!mobileMenuOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileMenuOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <div data-admin-workspace className="admin-workspace flex min-h-screen flex-col bg-surface">
      {/* Top Navigation Bar */}
      <header className="admin-topbar sticky top-0 z-30 border-b border-rule bg-surface/95 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <AdminHeaderBrand onToggleMobileMenu={() => setMobileMenuOpen(true)} />

          <div className="flex items-center gap-3">
            <AdminHeaderActions adminRole={adminRole} />
            <span className="hidden sm:inline h-4 w-[1px] bg-rule" />
            <div className="flex items-center gap-2">
              <span className="hidden xl:inline font-mono text-[11px] text-content-faint">
                {adminEmail}
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace with Sidebar */}
      <div className="flex flex-1 relative min-h-0">
        {/* Desktop Sticky Sidebar */}
        <div className="hidden lg:block shrink-0 sticky top-16 h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden">
          <AdminSidebar />
        </div>

        {/* Mobile Slide-out Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden animate-fade-in">
            <div
              className="fixed inset-0 bg-content/40 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              className="relative z-10 w-72 max-w-[85vw] h-full max-h-full overflow-hidden shadow-2xl animate-fade-up"
            >
              <AdminSidebar onClose={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Content Viewport */}
        <main className="admin-main min-w-0 flex-1 px-4 pb-12 pt-5 sm:px-8 sm:pt-7 xl:px-10">
          <div className="admin-content mx-auto w-full max-w-[1440px]">
            <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-content-faint">
              <span>Workspace</span><span className="text-accent/70" aria-hidden>/</span>
              <span>{currentGroup?.name ?? "Editor"}</span><span className="text-accent/70" aria-hidden>/</span>
              <span className="text-content-soft" aria-current="page">{currentPage}</span>
            </nav>
            <div key={pathname} className="admin-page-enter">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
