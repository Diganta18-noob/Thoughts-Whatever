"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  FileCode,
  KeyRound,
  SearchCheck,
  Network,
  Link2,
  Sparkles,
  Users2,
  Unlink,
  AtSign,
  ShieldAlert,
  Compass,
  Lightbulb,
  FileEdit,
  Send,
  Contact2,
  ListOrdered,
  CheckSquare,
  BarChart3,
  Activity,
  Cpu,
  Settings,
  ChevronDown,
  ChevronRight,
  Bot,
  ArrowLeft,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface SEONavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  exact?: boolean;
}

export interface SEONavGroup {
  name: string;
  items: SEONavItem[];
}

const SEO_NAV_GROUPS: SEONavGroup[] = [
  {
    name: "Dashboard",
    items: [
      { href: "/admin/seo-engine", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/admin/seo-engine/ai-assistant", label: "AI SEO Assistant", icon: Bot, badge: "AI" },
    ],
  },
  {
    name: "Website",
    items: [
      { href: "/admin/seo-engine/websites", label: "Websites", icon: Globe },
      { href: "/admin/seo-engine/pages", label: "Pages & Architecture", icon: FileCode },
    ],
  },
  {
    name: "SEO Strategy",
    items: [
      { href: "/admin/seo-engine/keywords", label: "Keyword Tracking", icon: KeyRound },
      { href: "/admin/seo-engine/audit", label: "Site Audit", icon: SearchCheck },
      { href: "/admin/seo-engine/internal-links", label: "Internal Links", icon: Network },
    ],
  },
  {
    name: "Organic Backlinks",
    items: [
      { href: "/admin/seo-engine/opportunities", label: "Opportunities", icon: Sparkles, badge: "Score" },
      { href: "/admin/seo-engine/competitors", label: "Competitor Gap", icon: Users2 },
      { href: "/admin/seo-engine/broken-links", label: "Broken Links", icon: Unlink },
      { href: "/admin/seo-engine/brand-mentions", label: "Brand Mentions", icon: AtSign },
      { href: "/admin/seo-engine/backlinks", label: "Backlink Monitor", icon: Link2 },
      { href: "/admin/seo-engine/health", label: "Risk & Health", icon: ShieldAlert },
    ],
  },
  {
    name: "Content Engine",
    items: [
      { href: "/admin/seo-engine/content-strategy", label: "Content Strategy", icon: Compass },
      { href: "/admin/seo-engine/linkable-assets", label: "Linkable Assets", icon: Lightbulb },
      { href: "/admin/seo-engine/content-briefs", label: "Content Briefs", icon: FileEdit },
    ],
  },
  {
    name: "Outreach CRM",
    items: [
      { href: "/admin/seo-engine/campaigns", label: "Campaigns", icon: Send },
      { href: "/admin/seo-engine/prospects", label: "Prospects Pipeline", icon: Contact2 },
      { href: "/admin/seo-engine/sequences", label: "Email Sequences", icon: ListOrdered },
    ],
  },
  {
    name: "Management & Reports",
    items: [
      { href: "/admin/seo-engine/tasks", label: "SEO Tasks", icon: CheckSquare },
      { href: "/admin/seo-engine/reports", label: "Weekly/Monthly Reports", icon: BarChart3 },
      { href: "/admin/seo-engine/activity", label: "Audit & Activity", icon: Activity },
    ],
  },
  {
    name: "System",
    items: [
      { href: "/admin/seo-engine/integrations", label: "Integrations", icon: Cpu },
      { href: "/admin/seo-engine/settings", label: "Engine Settings", icon: Settings },
    ],
  },
];

interface SEOSidebarProps {
  onClose?: () => void;
  className?: string;
}

export function SEOSidebar({ onClose, className }: SEOSidebarProps) {
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
        "flex h-full max-h-full min-h-0 flex-col overflow-hidden border-r border-rule bg-surface/95 backdrop-blur w-64 select-none",
        className
      )}
    >
      {/* Top Banner with Return to Main Admin */}
      <div className="shrink-0 border-b border-rule p-3 bg-surface-raised/40">
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 font-mono text-[11px] text-content-soft hover:text-content transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Main Admin</span>
          </Link>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1 text-content-soft hover:text-content rounded"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-content">
            SEO Growth Engine
          </span>
          <span className="ml-auto rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
            PRO
          </span>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 space-y-5 scrollbar-thin">
        {SEO_NAV_GROUPS.map((group) => {
          const isCollapsed = !!collapsedGroups[group.name];

          return (
            <div key={group.name} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup(group.name)}
                className="flex w-full items-center justify-between px-2 py-1 text-left font-mono text-[10px] uppercase tracking-wider text-content-faint hover:text-content transition"
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
                          <span className="rounded bg-accent/20 px-1.5 py-0.2 font-mono text-[9px] font-bold text-accent">
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
      <div className="shrink-0 border-t border-rule p-3 font-mono text-[10px] text-content-faint text-center flex items-center justify-between">
        <span>White-Hat Organic SEO</span>
        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Active</span>
      </div>
    </aside>
  );
}
