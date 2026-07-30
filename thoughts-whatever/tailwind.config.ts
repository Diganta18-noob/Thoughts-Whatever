import type { Config } from "tailwindcss";

/**
 * Two visual systems live in this file.
 *
 *   journal.*  — the literary-magazine surface used across most of the site.
 *                Cream paper, warm ink, deep vermilion rules.
 *   archive.*  — the dark, cinematic surface scoped to /documentary.
 *
 * Reading themes (cream / sepia / night) are driven by CSS variables in
 * globals.css and toggled by a `data-theme` attribute on <html>, so that a
 * reader's choice survives navigation without a flash of the wrong colour.
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── Literary journal ────────────────────────────────
        journal: {
          paper: "#FDFBF5",
          paperEdge: "#F4EFE2",
          ink: "#1F1B16",
          inkSoft: "#4A4238",
          inkFaint: "#8A7F6E",
          rule: "#DED5C2",
          vermilion: "#8C2F1F",
          vermilionSoft: "#B4573F",
        },
        // ─── Documentary archive ─────────────────────────────
        archive: {
          void: "#0A0A0B",
          panel: "#131315",
          panelEdge: "#232326",
          bone: "#E8E6E1",
          boneSoft: "#A5A29B",
          boneFaint: "#6B6862",
          ember: "#C1440E",
          emberSoft: "#E0703C",
        },
        // ─── Reading-theme surfaces (CSS-variable driven) ────
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-raised": "rgb(var(--surface-raised) / <alpha-value>)",
        content: "rgb(var(--content) / <alpha-value>)",
        "content-soft": "rgb(var(--content-soft) / <alpha-value>)",
        "content-faint": "rgb(var(--content-faint) / <alpha-value>)",
        rule: "rgb(var(--rule) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
      },
      fontFamily: {
        // Bengali content — real weights only, never faux-bold.
        bengali: ["var(--font-bengali-serif)", "SolaimanLipi", "Kalpurush", "Vrinda", "serif"],
        "bengali-sans": ["var(--font-bengali-sans)", "SolaimanLipi", "Kalpurush", "sans-serif"],
        // Bengali display / wordmark.
        display: ["var(--font-bengali-display)", "var(--font-bengali-serif)", "serif"],
        // Latin — the interface is in English.
        serif: ["var(--font-latin-serif)", "Georgia", "serif"],
        sans: ["var(--font-latin-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        // Bengali needs more vertical room than Latin at the same size.
        "bengali-sm": ["0.9375rem", { lineHeight: "1.85" }],
        "bengali-base": ["1.0625rem", { lineHeight: "1.9" }],
        "bengali-lg": ["1.1875rem", { lineHeight: "1.95" }],
        "bengali-xl": ["1.3125rem", { lineHeight: "1.9" }],
      },
      maxWidth: {
        measure: "38rem", // ~62 Bengali characters — comfortable reading measure
        "measure-wide": "46rem",
      },
      letterSpacing: {
        label: "0.14em",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        "fade-in": "fade-in 0.4s ease-out both",
        "slide-up": "slide-up 0.28s cubic-bezier(0.32, 0.72, 0, 1) both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
