import React from "react";
import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getWebsites } from "@/lib/seo-engine/websites";
import { SEOWebsiteProvider } from "@/contexts/seo-website-context";
import { SEOSidebar } from "@/components/admin/seo-engine/seo-sidebar";
import { WebsiteSwitcher } from "@/components/admin/seo-engine/website-switcher";
import { Sparkles, Bot, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "SEO Growth Engine — Organic Backlink & SEO Suite",
  description: "White-hat SEO intelligence, opportunity discovery, outreach CRM, and backlink monitoring.",
};

export default async function SEOGrowthEngineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const websites = await getWebsites();

  return (
    <SEOWebsiteProvider initialWebsites={websites}>
      <div className="space-y-6">
        {/* SEO Header Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-rule bg-surface-raised/40 p-4 backdrop-blur shadow-2xs">
          <div className="flex items-center gap-3">
            <WebsiteSwitcher />
            <span className="hidden md:inline h-4 w-[1px] bg-rule" />
            <div className="hidden md:flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                White-Hat Engine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Link
              href="/admin/seo-engine/ai-assistant"
              className="flex items-center gap-1.5 rounded-md border border-rule bg-surface px-3 py-1.5 text-xs font-medium text-content hover:bg-surface-raised transition shadow-2xs"
            >
              <Bot className="h-3.5 w-3.5 text-accent" />
              <span>AI Advisor</span>
            </Link>

            <Link
              href="/admin/seo-engine/opportunities"
              className="flex items-center gap-1.5 rounded-md bg-accent px-3.5 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition shadow-xs"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Discover Links</span>
            </Link>
          </div>
        </div>

        {/* Main SEO Engine Content Viewport */}
        <div>
          {children}
        </div>
      </div>
    </SEOWebsiteProvider>
  );
}
