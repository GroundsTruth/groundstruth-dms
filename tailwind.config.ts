import type { Config } from "tailwindcss";

// Brand tokens are sourced from AGENTS.md / README.md:
//   Campa Purple #5D2081 (primary) · purple tint #EFE7F5 · Campa Red #E2231A (ALERTS ONLY)
//   near-white #F6F4F8 background · status green/amber/red (always paired with a word).
// shadcn/ui reads the HSL CSS variables defined in src/app/globals.css.
const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        // Raw Campa brand swatches (use sparingly; prefer the semantic tokens above).
        campa: {
          purple: "#5D2081",
          tint: "#EFE7F5",
          red: "#E2231A",
        },
        // Status — always render with an accompanying word/label, never colour alone.
        status: {
          ok: "#1FB57A",
          warn: "#F59E0B",
          bad: "#E2231A",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
