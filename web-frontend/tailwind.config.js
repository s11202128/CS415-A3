/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Bank of Fiji brand palette (premium fintech)
        navy: {
          50: "#eef2fb",
          100: "#d6dff3",
          200: "#a8b8e2",
          300: "#7a91d1",
          400: "#4c6ac0",
          500: "#2c4ca6",
          600: "#1f3a85",
          700: "#172b63",
          800: "#0f1d44",
          900: "#0a1733",
          950: "#050b1d",
        },
        royal: {
          500: "#1e3a8a",
          600: "#1e40af",
          700: "#1d4ed8",
        },
        cyan: {
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
        },
        teal: {
          400: "#2dd4bf",
          500: "#14b8a6",
        },
        ink: "#0b1220",
        canvas: "#f6f8fc",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card: "0 4px 24px -8px rgba(15, 29, 68, 0.18), 0 1px 3px rgba(15, 29, 68, 0.06)",
        "card-hover": "0 12px 40px -12px rgba(15, 29, 68, 0.32), 0 2px 6px rgba(15, 29, 68, 0.08)",
        glow: "0 0 32px -8px rgba(34, 211, 238, 0.55)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #0a1733 0%, #1e3a8a 50%, #0891b2 100%)",
        "card-savings":  "linear-gradient(135deg, #0a1733 0%, #1d4ed8 100%)",
        "card-everyday": "linear-gradient(135deg, #0891b2 0%, #2dd4bf 100%)",
        "card-business": "linear-gradient(135deg, #172b63 0%, #4c6ac0 100%)",
        "card-credit":   "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        "glass": "linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02))",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
        shimmer: "shimmer 1.4s linear infinite",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
