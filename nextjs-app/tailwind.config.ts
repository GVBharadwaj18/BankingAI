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
        // Premium Fintech Palette: Deep Navy + Cyan + Gold
        primary: {
          50: "#e0f7fa",
          100: "#b2ebf2",
          200: "#80deea",
          300: "#4dd0e1",
          400: "#26c6da",
          500: "#00bcd4",
          600: "#00acc1",
          700: "#0097a7",
          800: "#00838f",
          900: "#006064",
          950: "#003f47",
        },
        secondary: {
          50: "#e8f4fd",
          100: "#c5e3f9",
          200: "#9ecff5",
          300: "#70b8f0",
          400: "#4aa8ec",
          500: "#2196f3",
          600: "#1e88e5",
          700: "#1976d2",
          800: "#1565c0",
          900: "#0d47a1",
          950: "#0a2d6b",
        },
        accent: {
          50: "#fffde7",
          100: "#fff9c4",
          200: "#fff176",
          300: "#ffee58",
          400: "#ffeb3b",
          500: "#ffc107",
          600: "#ffb300",
          700: "#ffa000",
          800: "#ff8f00",
          900: "#ff6f00",
          950: "#e65100",
          neon: "#00E5FF",
        },
        dark: {
          50: "#111827",
          100: "#1a2235",
          200: "#1e2d45",
          300: "#263548",
          400: "#354766",
          500: "#4a5568",
          600: "#718096",
          700: "#a0aec0",
          800: "#e2e8f0",
          900: "#f7fafc",
          950: "#080e1c",
        },
        glass: {
          light: "rgba(0, 229, 255, 0.06)",
          medium: "rgba(0, 229, 255, 0.10)",
          dark: "rgba(0, 0, 0, 0.15)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-poppins)", "var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-dark": "linear-gradient(135deg, #020810 0%, #060f1e 30%, #091628 65%, #030b16 100%)",
        "gradient-primary": "linear-gradient(135deg, #00bcd4 0%, #0097a7 50%, #00838f 100%)",
        "gradient-secondary": "linear-gradient(135deg, #2196f3 0%, #1976d2 50%, #1565c0 100%)",
        "gradient-accent": "linear-gradient(135deg, #00E5FF 0%, #00bcd4 50%, #0097a7 100%)",
        "gradient-gold": "linear-gradient(135deg, #ffd700 0%, #ffc107 50%, #ff8f00 100%)",
        "gradient-glass": "linear-gradient(135deg, rgba(0,229,255,0.06) 0%, rgba(0,229,255,0.02) 100%)",
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 229, 255, 0.08)',
        'glass-lg': '0 25px 45px -12px rgba(0, 0, 0, 0.4)',
        'neon': '0 0 20px rgba(0, 229, 255, 0.45)',
        'neon-lg': '0 0 50px rgba(0, 229, 255, 0.3)',
        'gold': '0 0 20px rgba(255, 193, 7, 0.4)',
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
