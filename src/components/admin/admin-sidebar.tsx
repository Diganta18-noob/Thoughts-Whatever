"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import {
  ADMIN_NAV_GROUPS,
  resolveActiveGroup,
  resolveActiveHref,
} from "@/lib/admin-nav";
import { NavIcon } from "@/components/admin/nav-icon";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";

const COLLAPSE_STORAGE_KEY = "tw:admin:collapsed-nav-groups";

interface AdminSidebarProps {
  onClose?: () => void;
  className?: string;
}

export function AdminSidebar({ onClose, className }: AdminSidebarProps) {
  const pathname = usePathname() ?? "";
  const activeHref = resolveActiveHref(pathname, { visibleOnly: true });
  const activeGroup = resolveActiveGroup(activeHref);

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Read on mount, not during render: `localStorage` does not exist on the
  // server, and seeding initial state from it would desync hydration.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(COLLAPSE_STORAGE_KEY);
      if (stored) setCollapsedGroups(JSON.parse(stored) as Record<string, boolean>);
    } catch {
      // Private-mode and quota failures are not worth surfacing — the rail just
      // opens fully expanded, which is the sane default anyway.
    }
  }, []);

  // Reveal wherever you just landed. Jumping via ⌘K used to drop you on a page
  // whose nav entry sat inside a group you had collapsed, leaving nothing in the
  // rail to say where you were. Collapsing the active group by hand still works;
  // navigating away and back re-opens it.
  useEffect(() => {
    if (!activeGroup) return;

    setCollapsedGroups((prev) => {
      if (!prev[activeGroup]) return prev;
      const next = { ...prev, [activeGroup]: false };
      persistCollapsedGroups(next);
      return next;
    });
  }, [activeGroup]);

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups((prev) => {
      const next = { ...prev, [groupName]: !prev[groupName] };
      persistCollapsedGroups(next);
      return next;
    });
  };

  return (
    <aside
      aria-label="Admin sections"
      className={cn(
        "admin-sidebar flex h-full max-h-full min-h-0 w-72 select-none flex-col overflow-hidden border-r border-rule bg-surface/90 backdrop-blur",
        className
      )}
    >
      {/* Sidebar Header on mobile with close button */}
      {onClose && (
        <div className="flex shrink-0 items-center justify-between border-b border-rule p-4 lg:hidden">
          <span className="font-serif text-sm font-semibold tracking-wide text-content">
            Navigation Menu
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="rounded p-1 text-content-soft hover:bg-surface hover:text-content"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Navigation Links Scrollable */}
      <nav
        className="scrollbar-thin min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-3 py-5"
      >
        {ADMIN_NAV_GROUPS.map((group) => {
          const isCollapsed = !!collapsedGroups[group.name];
          const panelId = `admin-nav-${group.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
          const visibleItems = group.items.filter((item) => !item.hidden);

          return (
            <div key={group.name} className="space-y-1">
              <Button variant="ghost" size="sm"
                onClick={() => toggleGroup(group.name)}
                aria-expanded={!isCollapsed}
                aria-controls={panelId}
                className="justify-between text-left font-mono text-[10px] uppercase tracking-wider"
              >
                <span>{group.name}</span>
                <span className="flex items-center gap-1.5">
                  {/* A collapsed group holding the current page still says so. */}
                  {isCollapsed && group.name === activeGroup && (
                    <span className="h-1 w-1 rounded-full bg-accent" aria-hidden />
                  )}
                  {isCollapsed ? (
                    <ChevronRight className="h-3 w-3" aria-hidden />
                  ) : (
                    <ChevronDown className="h-3 w-3" aria-hidden />
                  )}
                </span>
              </Button>

              <div className={cn("admin-nav-panel", isCollapsed && "admin-nav-panel-closed")}>
                <div id={panelId} className="space-y-0.5 overflow-hidden pt-0.5" inert={isCollapsed}>
                  {visibleItems.map((item) => {
                    const active = item.href === activeHref;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "admin-nav-link flex items-center justify-between rounded-card border border-transparent px-3 py-2 font-sans text-xs transition-[background-color,color,border-color,transform] duration-200",
                          active
                            ? "admin-nav-link-active border-accent/25 bg-accent/12 font-medium text-accent shadow-xs"
                            : "text-content-soft hover:border-rule hover:bg-surface-raised hover:text-content"
                        )}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <NavIcon
                            name={item.icon}
                            className={cn(
                              "h-3.5 w-3.5 shrink-0",
                              active ? "text-accent" : "text-content-faint"
                            )}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>

                        {item.badge && (
                          <span className="rounded bg-accent px-1.5 py-0.5 font-mono text-[9px] font-bold leading-none text-surface">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="shrink-0 border-t border-rule p-3 font-mono text-[10px] text-content-faint text-center">
        Editor&apos;s Room OS &bull; v2.0
      </div>
    </aside>
  );
}

function persistCollapsedGroups(groups: Record<string, boolean>) {
  try {
    window.localStorage.setItem(COLLAPSE_STORAGE_KEY, JSON.stringify(groups));
  } catch {
    // See the mount effect above: a failed write only costs the preference.
  }
}
