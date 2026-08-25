"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { WebsiteSummary } from "@/lib/seo-engine/websites";

interface SEOWebsiteContextType {
  websites: WebsiteSummary[];
  activeWebsite: WebsiteSummary | null;
  activeWebsiteId: string | null;
  setActiveWebsiteId: (id: string) => void;
  isLoading: boolean;
  refreshWebsites: () => Promise<void>;
}

const SEOWebsiteContext = createContext<SEOWebsiteContextType | undefined>(undefined);

const STORAGE_KEY = "tw_seo_active_website_id";
const COOKIE_KEY = "tw_active_website";

export function SEOWebsiteProvider({
  children,
  initialWebsites = [],
  initialActiveId,
}: {
  children: React.ReactNode;
  initialWebsites?: WebsiteSummary[];
  initialActiveId?: string;
}) {
  const [websites, setWebsites] = useState<WebsiteSummary[]>(initialWebsites);
  const [activeWebsiteId, setActiveWebsiteIdState] = useState<string | null>(
    initialActiveId || initialWebsites.find((w) => w.isDefault)?.id || initialWebsites[0]?.id || null
  );
  const [isLoading, setIsLoading] = useState(initialWebsites.length === 0);

  const refreshWebsites = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/seo-engine/websites");
      if (res.ok) {
        const data = await res.json();
        setWebsites(data.websites || []);
        
        // If current active is not in list, fallback
        if (!data.websites.some((w: WebsiteSummary) => w.id === activeWebsiteId)) {
          const defaultWeb = data.websites.find((w: WebsiteSummary) => w.isDefault) || data.websites[0];
          if (defaultWeb) {
            setActiveWebsiteIdState(defaultWeb.id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch websites:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeWebsiteId]);

  useEffect(() => {
    // Client-side initialization check with localStorage
    if (typeof window !== "undefined") {
      const savedId = localStorage.getItem(STORAGE_KEY);
      if (savedId && websites.some((w) => w.id === savedId)) {
        setActiveWebsiteIdState(savedId);
      } else if (!activeWebsiteId && websites.length > 0) {
        const def = websites.find((w) => w.isDefault) || websites[0];
        setActiveWebsiteIdState(def.id);
      }
    }
  }, [websites, activeWebsiteId]);

  const setActiveWebsiteId = (id: string) => {
    setActiveWebsiteIdState(id);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, id);
      document.cookie = `${COOKIE_KEY}=${id}; path=/; max-age=31536000; SameSite=Lax`;
    }
  };

  const activeWebsite = websites.find((w) => w.id === activeWebsiteId) || websites[0] || null;

  return (
    <SEOWebsiteContext.Provider
      value={{
        websites,
        activeWebsite,
        activeWebsiteId,
        setActiveWebsiteId,
        isLoading,
        refreshWebsites,
      }}
    >
      {children}
    </SEOWebsiteContext.Provider>
  );
}

export function useSEOWebsite() {
  const context = useContext(SEOWebsiteContext);
  if (!context) {
    throw new Error("useSEOWebsite must be used within an SEOWebsiteProvider");
  }
  return context;
}
