"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type ThemeMode = "cream" | "sepia" | "night";
type FontSize = "sm" | "base" | "lg" | "xl";

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("cream");
  const [fontSize, setFontSizeState] = useState<FontSize>("base");

  useEffect(() => {
    const savedTheme = (localStorage.getItem("bengali_doc_theme") as ThemeMode) || "cream";
    const savedFontSize = (localStorage.getItem("bengali_doc_font_size") as FontSize) || "base";
    setThemeState(savedTheme);
    setFontSizeState(savedFontSize);
  }, []);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    localStorage.setItem("bengali_doc_theme", mode);
    document.documentElement.setAttribute("data-theme", mode);
  };

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem("bengali_doc_font_size", size);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, fontSize, setFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
