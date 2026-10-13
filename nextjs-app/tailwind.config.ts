import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Classic Heritage Banking Palette: Obsidian Slate + Champagne Gold + Royal Emerald
        obsidian: {
          50: "#f6f8fb",
          100: "#e9edf4",
          200: "#cfd9e8",
          300: "#a6b9d4",
          400: "#7493bc",
          500: "#4f72a4",
          600: "#3d5a88",
          700: "#32486f",
          800: "#1a253a",
          900: "#0f172a",
          950: "#090d16",
        },
        gold: {
          50: "#fcfaf3",
          100: "#f7f2e1",
          200: "#eee2bd",
          300: "#e2ce92",
          400: "#d4b868",
          500: "#c5a448",
          600: "#aa8637",
          700: "#86662d",
          800: "#6e522b",
          900: "#5b4327",
          950: "#342412",
        },
        emerald: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
        slate: {
          850: "#141c2e",
          900: "#0f172a",
          950: "#0a0f1d",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        display: ["var(--font-serif)", "var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "Menlo", "Consolas", "monospace"],
      },
      backgroundImage: {
        "classic-dark": "linear-gradient(180deg, #090d16 0%, #0d1322 50%, #080c14 100%)",
        "card-noir": "linear-gradient(135deg, #161c28 0%, #0b0f17 50%, #1a2233 100%)",
        "card-gold": "linear-gradient(135deg, #382c16 0%, #876c33 45%, #2a200f 100%)",
        "card-emerald": "linear-gradient(135deg, #07291f 0%, #0b4937 50%, #051c15 100%)",
        "gold-shimmer": "linear-gradient(90deg, #aa8637 0%, #f7f2e1 50%, #aa8637 100%)",
      },
      boxShadow: {
        'classic': '0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.07)',
        'classic-lg': '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        'gold-subtle': '0 4px 20px -2px rgba(197, 164, 72, 0.15)',
        'card-emboss': '0 20px 40px -15px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.15)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
export default config;
