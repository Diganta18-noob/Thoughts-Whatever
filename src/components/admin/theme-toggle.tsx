"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function AdminThemeToggle() {
  const [theme, setTheme] = useState<"cream" | "night">("cream");

  useEffect(() => {
    const saved = localStorage.getItem("tw_theme") as "cream" | "night" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      const current = document.documentElement.getAttribute("data-theme") as "cream" | "night" | null;
      if (current) setTheme(current);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "cream" ? "night" : "cream";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("tw_theme", next);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex h-8 w-8 items-center justify-center rounded-sm border border-rule text-content-soft transition hover:border-accent hover:text-accent"
      title={`Switch to ${theme === "cream" ? "Dark (Night)" : "Light (Cream)"} theme`}
      aria-label="Toggle theme"
    >
      {theme === "cream" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}
