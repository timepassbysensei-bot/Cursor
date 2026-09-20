/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#102A43",
          dark: "#071A2B",
          mid: "#1F4E78",
          soft: "#243B53",
        },
        green: {
          academy: "#315C45",
          success: "#15803D",
        },
        saffron: {
          DEFAULT: "#D97706",
          soft: "#F59E0B",
          pale: "#FDF3E3",
        },
        cream: {
          DEFAULT: "#FDF8F0",
          soft: "#FAF3E7",
        },
        offwhite: "#F8FAFC",
        lightgray: "#E5E7EB",
        ink: "#172033",
        muted: "#64748B",
        error: "#B91C1C",
      },
      fontFamily: {
        display: ["Manrope", "Montserrat", "Poppins", "system-ui", "sans-serif"],
        body: ["Inter", "Source Sans 3", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,42,67,0.06), 0 8px 24px -12px rgba(16,42,67,0.14)",
        lift: "0 2px 4px rgba(16,42,67,0.08), 0 16px 40px -16px rgba(16,42,67,0.22)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        marquee: "marquee 30s linear infinite",
      },
    },
  },
  plugins: [],
};
