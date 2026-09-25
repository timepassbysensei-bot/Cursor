/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Base strata — deep teal-navy rather than flat navy.
        base: "#071015",
        surface: "#0B1718",
        elevated: "#111A25",
        panel: "#0D1A1D",
        night: "#17152A",
        ink: "#F7F8FC",
        muted: "#9FB0BF",
        faint: "#64798A",
        hairline: "rgba(247,248,252,0.10)",

        // Genshin-inspired: botanical, luminous, warm.
        mint: "#A8E6A3",
        mintSoft: "#D8F5C5",
        jade: "#9BE7BE",
        gold: "#F3D58A",
        cream: "#FFF3CF",
        sage: "#B9E4D0",

        // Wuthering Waves-inspired: atmospheric, electric, cool.
        cyan: "#78DCE8",
        ocean: "#56C9D6",
        sky: "#8EB7FF",
        lavender: "#A79BFF",
        violet: "#CFB6FF",
        smoky: "#8EA6C8",
        coral: "#F2A6A0",

        // Back-compat alias for legacy `blue` tokens still used across pages.
        blue: "#78DCE8",
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
        glow: "0 0 60px -18px rgba(120,220,232,0.5)",
        "glow-jade": "0 0 60px -18px rgba(168,230,163,0.45)",
        "glow-gold": "0 0 60px -16px rgba(243,213,138,0.4)",
        "glow-violet": "0 0 60px -18px rgba(207,182,255,0.5)",
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
        // Ambient life.
        aurora: {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)", opacity: "0.55" },
          "50%": { transform: "translate3d(6%, -4%, 0) scale(1.12)", opacity: "0.85" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(0, -14px, 0)" },
        },
        "rise": {
          "0%": { transform: "translate3d(0, 0, 0)", opacity: "0" },
          "12%": { opacity: "0.5" },
          "100%": { transform: "translate3d(var(--rise-x, 12px), -120px, 0)", opacity: "0" },
        },
        "shimmer-line": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both",
        drift: "drift 22s ease-in-out infinite",
        sheen: "sheen 6s ease-in-out infinite",
        marquee: "marquee 40s linear infinite",
        "skeleton-sweep": "skeleton-sweep 1.6s ease-in-out infinite",
        aurora: "aurora 18s ease-in-out infinite",
        "float-slow": "float-slow 9s ease-in-out infinite",
        rise: "rise 11s linear infinite",
        "shimmer-line": "shimmer-line 2.6s ease-in-out infinite",
        "pulse-soft": "pulse-soft 2.4s ease-in-out infinite",
      },
      transitionTimingFunction: {
        editorial: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
