import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
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
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-raised": "rgb(var(--surface-raised) / <alpha-value>)",
        content: "rgb(var(--content) / <alpha-value>)",
        "content-soft": "rgb(var(--content-soft) / <alpha-value>)",
        "content-faint": "rgb(var(--content-faint) / <alpha-value>)",
        rule: "rgb(var(--rule) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
      },
      fontFamily: {
        bengali: ["var(--font-bengali-serif)", "SolaimanLipi", "Kalpurush", "Vrinda", "serif"],
        "bengali-sans": ["var(--font-bengali-sans)", "SolaimanLipi", "Kalpurush", "sans-serif"],
        display: ["var(--font-bengali-display)", "var(--font-bengali-serif)", "serif"],
        serif: ["var(--font-latin-serif)", "Georgia", "serif"],
        sans: ["var(--font-latin-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "bengali-sm": ["0.9375rem", { lineHeight: "1.85" }],
        "bengali-base": ["1.0625rem", { lineHeight: "1.9" }],
        "bengali-lg": ["1.1875rem", { lineHeight: "1.95" }],
        "bengali-xl": ["1.3125rem", { lineHeight: "1.9" }],
      },
      maxWidth: {
        measure: "38rem",
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
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        "fade-in": "fade-in 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
