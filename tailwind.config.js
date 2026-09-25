/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#080B14",
        surface: "#101625",
        elevated: "#151D31",
        ink: "#F7F8FC",
        muted: "#98A3B8",
        faint: "#6B7691",
        hairline: "rgba(247,248,252,0.10)",
        blue: "#5E9FE8",
        cyan: "#52D6E8",
        violet: "#9B7CFF",
        jade: "#72BC8F",
        coral: "#E97366",
        // Dark-mode surfaces reused by the dashboard shell.
        panel: "#0C1120",
      },
      fontFamily: {
        display: ["Sora", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      maxWidth: {
        shell: "84rem",
      },
      boxShadow: {
        lift: "0 30px 70px -40px rgba(0,0,0,0.95)",
        glass:
          "0 1px 0 0 rgba(247,248,252,0.06) inset, 0 24px 60px -34px rgba(0,0,0,0.9)",
        glow: "0 0 60px -18px rgba(94,159,232,0.55)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        drift: {
          "0%": { transform: "translate3d(-4%, -2%, 0) scale(1)" },
          "50%": { transform: "translate3d(4%, 3%, 0) scale(1.08)" },
          "100%": { transform: "translate3d(-4%, -2%, 0) scale(1)" },
        },
        sheen: {
          "0%": { opacity: "0.35" },
          "50%": { opacity: "0.85" },
          "100%": { opacity: "0.35" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "skeleton-sweep": {
          "0%": { backgroundPosition: "-160% 0" },
          "100%": { backgroundPosition: "260% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both",
        drift: "drift 22s ease-in-out infinite",
        sheen: "sheen 6s ease-in-out infinite",
        marquee: "marquee 40s linear infinite",
        "skeleton-sweep": "skeleton-sweep 1.6s ease-in-out infinite",
      },
      transitionTimingFunction: {
        editorial: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
