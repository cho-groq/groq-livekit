import type { Config } from "tailwindcss";

const colors = require("tailwindcss/colors");
const defaultTheme = require("tailwindcss/defaultTheme");

const cartesia = {
  50: "#e0e8f8",
  100: "#c2d1f1",
  200: "#a4bbed",
  300: "#86a4ea",
  400: "#688ee8",
  500: "#1d4ed8",
  600: "#1a47c1",
  700: "#163faa",
  800: "#133793",
  900: "#102f7c",
  950: "#0c2565",
};

const groq = {
  "accent-bg": "#F55036",
  "content-bg": "#F55036",
  "content-text": "#161519",
  "accent-text": "#a1a0a7",
  "action-text": "#F05A28",
  "accent-border": "rgba(240, 90, 40, 0.15)",
  "accent-text-active": "#f37f58",
  "control-text": "#F55036",
  "content-bg-darker": "#EAEAEB",
  "button-bg": "#FFFFFF",
  "button-text": "#E92A0C",
};

const customColors = {
  cartesia,
  groq,
};

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    colors: {
      transparent: "transparent",
      current: "currentColor",
      black: colors.black,
      white: colors.white,
      gray: colors.neutral,
      ...colors,
      ...customColors,
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
      popover: {
        DEFAULT: "hsl(var(--popover))",
        foreground: "hsl(var(--popover-foreground))",
      },
      card: {
        DEFAULT: "hsl(var(--card))",
        foreground: "hsl(var(--card-foreground))",
      },
    },
    extend: {
      boxShadow: {
        "solid-offset": "3px 3px 0px 0px rgba(0, 0, 0, 1)",
        "solid-offset-hover": "4px 4px 0px 0px rgba(0, 0, 0, 1)",
        "solid-offset-active": "1px 1px 0px 0px rgba(0, 0, 0, 1)",
        "solid-offset-accent": "3px 3px 0px 0px " + cartesia[500],
        "solid-offset-accent-active": "3px 3px 0px 0px " + cartesia[500],
        "solid-offset-destructive": "3px 3px 0px 0px " + colors.red[500],
        "solid-offset-destructive-active": "1px 1px 0px 0px " + colors.red[500],
        "solid-offset-destructive-hover": "4px 4px 0px 0px " + colors.red[500],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
