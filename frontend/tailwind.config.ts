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
        /* ─── White & Blue Hackshastra Theme ─── */
        background: "#FFFFFF",
        "on-background": "#071014",
        surface: "#FFFFFF",
        "surface-dim": "#F8FAFC",
        "surface-bright": "#FFFFFF",
        "surface-container-lowest": "#FFFFFF",
        "surface-container-low": "#F8FAFC",
        "surface-container": "#F4F7F8",
        "surface-container-high": "#E8F7FE",
        "surface-container-highest": "#E2E8F0",
        "on-surface": "#071014",
        "on-surface-variant": "#334155",
        "inverse-surface": "#071014",
        "inverse-on-surface": "#FFFFFF",
        outline: "#E2E8F0",
        "outline-variant": "#CBD5E1",
        "surface-tint": "#0DA5F0",
        "surface-variant": "#F4F7F8",

        /* ─── Primary: Hackshastra Cyan-Blue ─── */
        primary: "#0DA5F0",
        "on-primary": "#FFFFFF",
        "primary-container": "#E8F7FE",
        "on-primary-container": "#03415F",
        "inverse-primary": "#0877AF",

        /* ─── Accent: Electric Blue ─── */
        accent: "#0DA5F0",
        "accent-light": "#38BDF8",
        "accent-dark": "#0877AF",
        "on-accent": "#FFFFFF",

        /* ─── Secondary: Soft Blue Tint ─── */
        secondary: "#E8F7FE",
        "on-secondary": "#03415F",
        "secondary-container": "#F0F9FF",
        "on-secondary-container": "#0284C7",

        /* ─── Tertiary: Sky Blue ─── */
        tertiary: "#0284C7",
        "tertiary-warm": "#0EA5E9",
        "on-tertiary": "#FFFFFF",
        "tertiary-container": "#E0F2FE",
        "on-tertiary-container": "#0369A1",

        /* ─── Status Colors ─── */
        error: "#EF4444",
        "on-error": "#FFFFFF",
        "error-container": "#FEE2E2",
        "on-error-container": "#991B1B",

        success: "#10B981",
        "success-light": "#34D399",
        warning: "#F59E0B",
        info: "#0DA5F0",

        /* ─── Glass & Surface Helpers for Clean White Theme ─── */
        "glass-subtle": "rgba(13, 165, 240, 0.04)",
        "glass-light": "rgba(244, 247, 248, 0.85)",
        "glass-medium": "rgba(232, 247, 254, 0.8)",
        "glass-heavy": "rgba(255, 255, 255, 0.95)",
        "glass-border": "#E2E8F0",
        "glass-border-light": "#F1F5F9",
      },

      fontFamily: {
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-space-grotesk)", "Space Grotesk", "sans-serif"],
        heading: ["var(--font-space-grotesk)", "Space Grotesk", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "monospace"],
      },

      fontSize: {
        /* Bold editorial headlines & typography */
        "display-xl": ["5.5rem", { lineHeight: "1.0", letterSpacing: "-0.04em", fontWeight: "900" }],
        "display-lg": ["4.5rem", { lineHeight: "1.05", letterSpacing: "-0.035em", fontWeight: "900" }],
        "display-md": ["3.5rem", { lineHeight: "1.1", letterSpacing: "-0.025em", fontWeight: "800" }],
        "display-sm": ["2.5rem", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "800" }],
        "headline-lg": ["2rem", { lineHeight: "1.2", letterSpacing: "-0.015em", fontWeight: "800" }],
        "headline-md": ["1.5rem", { lineHeight: "1.25", letterSpacing: "-0.01em", fontWeight: "700" }],
        "body-lg": ["1.125rem", { lineHeight: "1.6", fontWeight: "600" }],
        "body-md": ["1rem", { lineHeight: "1.6", fontWeight: "500" }],
        "body-sm": ["0.875rem", { lineHeight: "1.5", fontWeight: "500" }],
        "label-lg": ["0.875rem", { lineHeight: "1.4", letterSpacing: "0.02em", fontWeight: "700" }],
        "label-md": ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.03em", fontWeight: "700" }],
        "label-sm": ["0.6875rem", { lineHeight: "1.3", letterSpacing: "0.04em", fontWeight: "700" }],
      },

      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },

      boxShadow: {
        "level-1": "0 2px 8px -1px rgba(7, 16, 20, 0.06), 0 1px 3px -1px rgba(7, 16, 20, 0.04)",
        "level-2": "0 8px 24px -4px rgba(7, 16, 20, 0.08), 0 4px 12px -2px rgba(7, 16, 20, 0.05)",
        "level-3": "0 16px 36px -6px rgba(7, 16, 20, 0.1), 0 8px 16px -4px rgba(7, 16, 20, 0.06)",
        "glow-primary": "0 0 30px -5px rgba(13, 165, 240, 0.35), 0 0 60px -10px rgba(13, 165, 240, 0.15)",
        "glow-secondary": "0 0 30px -5px rgba(56, 189, 248, 0.3), 0 0 60px -10px rgba(56, 189, 248, 0.12)",
        "glow-accent": "0 0 20px -4px rgba(13, 165, 240, 0.4)",
        "glow-success": "0 0 20px -4px rgba(16, 185, 129, 0.3)",
        "glow-error": "0 0 20px -4px rgba(239, 68, 68, 0.3)",
        "inner-glow": "inset 0 1px 0 0 rgba(255, 255, 255, 0.8)",
      },

      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-primary": "linear-gradient(135deg, #0DA5F0 0%, #38BDF8 50%, #0284C7 100%)",
        "gradient-warm": "linear-gradient(135deg, #0DA5F0 0%, #0284C7 60%, #38BDF8 100%)",
        "gradient-cta": "linear-gradient(135deg, #0DA5F0 0%, #0877AF 100%)",
        "gradient-glass": "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(244,247,248,0.7) 100%)",
        "gradient-surface": "linear-gradient(180deg, #FFFFFF 0%, #F4F7F8 100%)",
      },

      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "fade-in-up": "fadeInUp 0.5s ease-out",
        "fade-in-down": "fadeInDown 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "float-slow": "float 8s ease-in-out infinite",
        "shimmer": "shimmer 2.5s linear infinite",
        "spin-slow": "spin 12s linear infinite",
        "orbit": "orbit 20s linear infinite",
        "breathe": "breathe 4s ease-in-out infinite",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInDown: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        orbit: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.5" },
          "50%": { transform: "scale(1.05)", opacity: "0.8" },
        },
      },

      transitionDuration: {
        "400": "400ms",
      },

      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
export default config;
