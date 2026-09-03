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
        background: "#0a0a0a",
        "on-background": "#fafafa",
        surface: "#171717",
        "surface-dim": "#0f0f0f",
        "surface-bright": "#262626",
        "surface-container-lowest": "#000000",
        "surface-container-low": "#0a0a0a",
        "surface-container": "#171717",
        "surface-container-high": "#262626",
        "surface-container-highest": "#404040",
        "on-surface": "#fafafa",
        "on-surface-variant": "#a1a1aa",
        "inverse-surface": "#fafafa",
        "inverse-on-surface": "#0a0a0a",
        outline: "#27272a",
        "outline-variant": "#18181b",
        "surface-tint": "#6366f1",
        "surface-variant": "#171717",
        
        primary: "#fafafa",
        "on-primary": "#0a0a0a",
        "primary-container": "#27272a",
        "on-primary-container": "#fafafa",
        "inverse-primary": "#a1a1aa",
        
        accent: "#6366f1",
        "on-accent": "#ffffff",
        
        secondary: "#27272a",
        "on-secondary": "#fafafa",
        "secondary-container": "#18181b",
        "on-secondary-container": "#e4e4e7",
        
        tertiary: "#ec4899",
        "on-tertiary": "#fdf2f8",
        "tertiary-container": "#be185d",
        "on-tertiary-container": "#fce7f3",
        
        error: "#ef4444",
        "on-error": "#450a0a",
        "error-container": "#b91c1c",
        "on-error-container": "#fecaca",
      },
      fontFamily: {
        sans: ["var(--font-hanken-grotesk)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      boxShadow: {
        'level-1': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'level-2': '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.25)',
        'glow-primary': '0 0 20px -5px rgba(139, 92, 246, 0.5)',
        'glow-secondary': '0 0 20px -5px rgba(56, 189, 248, 0.5)',
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        }
      },
    },
  },
  plugins: [],
};
export default config;
