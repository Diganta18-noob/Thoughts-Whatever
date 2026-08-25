"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSEOWebsite } from "@/contexts/seo-website-context";
import { Globe, ChevronDown, Plus, Check, ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function WebsiteSwitcher() {
  const { websites, activeWebsite, activeWebsiteId, setActiveWebsiteId } = useSEOWebsite();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 rounded-md border border-rule bg-surface px-3 py-1.5 text-xs font-medium text-content hover:bg-surface-raised transition shadow-2xs"
      >
        <div className="flex h-5 w-5 items-center justify-center rounded bg-accent/10 text-accent">
          <Globe className="h-3.5 w-3.5" />
        </div>
        <div className="flex flex-col text-left">
          <span className="truncate max-w-[140px] sm:max-w-[180px] font-semibold text-content leading-tight">
            {activeWebsite ? activeWebsite.name : "Select Project"}
          </span>
          <span className="truncate max-w-[140px] sm:max-w-[180px] font-mono text-[10px] text-content-faint">
            {activeWebsite ? activeWebsite.domain : "No domain"}
          </span>
        </div>
        <ChevronDown className={cn("h-3.5 w-3.5 text-content-soft transition", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 mt-1.5 w-72 rounded-lg border border-rule bg-surface p-1.5 shadow-xl z-50 animate-fade-in">
          <div className="px-2 py-1.5 border-b border-rule">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-content-faint">
              Active SEO Projects
            </span>
          </div>

          <div className="py-1 max-h-60 overflow-y-auto space-y-0.5 scrollbar-thin">
            {websites.map((w) => {
              const isSelected = w.id === activeWebsiteId;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => {
                    setActiveWebsiteId(w.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded px-2.5 py-2 text-left text-xs transition",
                    isSelected
                      ? "bg-accent/10 text-accent font-medium"
                      : "text-content-soft hover:bg-surface-raised hover:text-content"
                  )}
                >
                  <div className="flex flex-col truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-content truncate">{w.name}</span>
                      {w.isDefault && (
                        <span className="rounded bg-accent/10 px-1 py-0.2 font-mono text-[9px] text-accent">
                          Default
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-content-faint truncate">
                      {w.domain} &bull; {w.niche}
                    </span>
                  </div>
                  {isSelected && <Check className="h-4 w-4 shrink-0 text-accent" />}
                </button>
              );
            })}
          </div>

          <div className="border-t border-rule pt-1 mt-1 space-y-0.5">
            <Link
              href="/admin/seo-engine/websites"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded px-2.5 py-1.5 text-xs text-accent hover:bg-accent/10 transition font-medium"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Manage & Add Websites</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
