"use client";

import { useState } from "react";
import { AdminHeaderBrand, AdminHeaderActions } from "@/components/admin/admin-header-chrome";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { LogoutButton } from "@/components/admin/logout-button";

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

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-rule bg-surface/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
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
      <div className="flex flex-1 relative">
        {/* Desktop Sticky Sidebar */}
        <div className="hidden lg:block shrink-0 sticky top-14 h-[calc(100vh-3.5rem)]">
          <AdminSidebar />
        </div>

        {/* Mobile Slide-out Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden animate-fade-in">
            <div
              className="fixed inset-0 bg-content/40 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl animate-fade-up">
              <AdminSidebar onClose={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Content Viewport */}
        <main className="flex-1 min-w-0 p-4 sm:p-8 max-w-6xl">
          {children}
        </main>
      </div>
    </div>
  );
}
