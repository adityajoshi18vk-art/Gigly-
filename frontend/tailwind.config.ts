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
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#0D9488", // Teal 600
          hover: "#0F766E", // Teal 700
          active: "#115E59", // Teal 800
        },
        status: {
          success: "#10B981", // Emerald 500
          pending: "#F59E0B", // Amber 500
          danger: "#F43F5E", // Rose 500
        }
      },
      borderRadius: {
        xl: "12px",
      },
      boxShadow: {
        soft: "0 2px 8px -2px rgba(0, 0, 0, 0.05), 0 4px 12px -4px rgba(0, 0, 0, 0.02)",
      }
    },
  },
  plugins: [],
};
export default config;
