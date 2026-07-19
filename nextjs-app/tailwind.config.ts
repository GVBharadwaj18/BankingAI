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
        // Modern Banking App Palette
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        secondary: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7e22ce",
          800: "#6b21a8",
          900: "#581c87",
          950: "#3b0764",
        },
        accent: {
          50: "#fdf2f8",
          100: "#fce7f3",
          200: "#fbcfe8",
          300: "#f472b6",
          400: "#ec4899",
          500: "#db2777",
          600: "#c2185b",
          700: "#9d174d",
          800: "#831843",
          900: "#500724",
          950: "#4c0519",
          neon: "#D946EF",
        },
        dark: {
          50: "#18181b",
          100: "#27272a",
          200: "#3f3f46",
          300: "#52525b",
          400: "#71717a",
          500: "#a1a1aa",
          600: "#d4d4d8",
          700: "#e4e4e7",
          800: "#f4f4f5",
          900: "#fafafa",
          950: "#09090b",
        },
        glass: {
          light: "rgba(255, 255, 255, 0.1)",
          medium: "rgba(255, 255, 255, 0.15)",
          dark: "rgba(0, 0, 0, 0.1)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-poppins)", "var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-dark": "linear-gradient(135deg, #07070F 0%, #0A0D22 35%, #150F33 75%, #05020C 100%)",
        "gradient-primary": "linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #3730a3 100%)",
        "gradient-secondary": "linear-gradient(135deg, #a855f7 0%, #8b5cf6 50%, #6d28d9 100%)",
        "gradient-accent": "linear-gradient(135deg, #ec4899 0%, #d946ef 50%, #a855f7 100%)",
        "gradient-glass": "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-lg': '0 25px 45px -12px rgba(0, 0, 0, 0.25)',
        'neon': '0 0 20px rgba(217, 70, 239, 0.5)',
        'neon-lg': '0 0 40px rgba(217, 70, 239, 0.4)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
    },
  },
  plugins: [],
};
export default config;
