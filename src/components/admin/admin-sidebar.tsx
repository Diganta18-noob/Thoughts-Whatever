"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  Tags,
  UploadCloud,
  Image as ImageIcon,
  BarChart2,
  BookOpen,
  Globe,
  Target,
  HeartPulse,
  SearchCheck,
  Activity,
  Bell,
  Sparkles,
  Users,
  ShieldCheck,
  ClipboardList,
  Mail,
  Languages,
  Settings,
  Database,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  exact?: boolean;
}

export interface NavGroup {
  name: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    name: "Content",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/admin/pieces", label: "Pieces", icon: FileText },
      { href: "/admin/series", label: "Series", icon: FolderTree },
      { href: "/admin/taxonomy", label: "Taxonomy", icon: Tags },
      { href: "/admin/media", label: "Media Library", icon: ImageIcon },
      { href: "/admin/import", label: "Import", icon: UploadCloud },
    ],
  },
  {
    name: "Intelligence",
    items: [
      { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
      { href: "/admin/engagement", label: "Reading & Engagement", icon: BookOpen },
      { href: "/admin/geography", label: "Audience Geography", icon: Globe },
      { href: "/admin/content-health", label: "Content Health", icon: HeartPulse },
      { href: "/admin/seo", label: "SEO Scanner", icon: SearchCheck },
    ],
  },
  {
    name: "Workflow",
    items: [
      { href: "/admin/activity", label: "Activity Feed", icon: Activity },
      { href: "/admin/goals", label: "Editorial Goals", icon: Target },
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
      { href: "/admin/prompts", label: "Prompts & Ideas", icon: Sparkles },
    ],
  },
  {
    name: "Administration",
    items: [
      { href: "/admin/team", label: "Team & Roles", icon: Users },
      { href: "/admin/security", label: "Security Center", icon: ShieldCheck },
      { href: "/admin/audit-log", label: "Audit Log", icon: ClipboardList },
      { href: "/admin/subscribers", label: "Subscribers", icon: Mail },
      { href: "/admin/transliteration", label: "Transliteration", icon: Languages },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
  {
    name: "System",
    items: [
      { href: "/admin/system", label: "System & Ops", icon: Database },
    ],
  },
];

interface AdminSidebarProps {
  onClose?: () => void;
  className?: string;
}

export function AdminSidebar({ onClose, className }: AdminSidebarProps) {
  const pathname = usePathname() ?? "";
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-rule bg-surface/90 backdrop-blur w-64 select-none",
        className
      )}
    >
      {/* Sidebar Header on mobile with close button */}
      {onClose && (
        <div className="flex items-center justify-between border-b border-rule p-4 lg:hidden">
          <span className="font-serif text-sm font-semibold tracking-wide text-content">
            Navigation Menu
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-content-soft hover:bg-surface hover:text-content"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Navigation Links Scrollable */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_GROUPS.map((group) => {
          const isCollapsed = !!collapsedGroups[group.name];

          return (
            <div key={group.name} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup(group.name)}
                className="flex w-full items-center justify-between px-2.5 py-1 text-left font-mono text-[10px] uppercase tracking-wider text-content-faint hover:text-content transition"
              >
                <span>{group.name}</span>
                {isCollapsed ? (
                  <ChevronRight className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>

              {!isCollapsed && (
                <div className="space-y-0.5 pt-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = item.exact
                      ? pathname === item.href
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center justify-between rounded-sm px-2.5 py-1.5 font-sans text-xs transition",
                          active
                            ? "bg-accent/10 font-semibold text-accent"
                            : "text-content-soft hover:bg-surface-raised hover:text-content"
                        )}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon
                            className={cn(
                              "h-3.5 w-3.5 shrink-0",
                              active ? "text-accent" : "text-content-faint"
                            )}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>

                        {item.badge && (
                          <span className="rounded bg-accent px-1.5 py-0.2 font-mono text-[9px] font-bold text-white">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      <div className="border-t border-rule p-3 font-mono text-[10px] text-content-faint text-center">
        Editor&apos;s Room OS &bull; v2.0
      </div>
    </aside>
  );
}
