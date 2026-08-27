import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        lab: {
          950: "#08090b",
          900: "#0d0f13",
          850: "#11141a",
          800: "#161a21",
          700: "#1f242e",
          600: "#2a303c",
          500: "#5b6472",
          400: "#8a93a0",
          300: "#b8c0cc",
        },
        signal: {
          valid: "#2ecc8f",
          invalid: "#ef4444",
          pending: "#eab308",
          info: "#4fa3ff",
        },
        echolink: {
          orange: "#E8641E",
          "orange-dim": "#b84f18",
          "orange-glow": "#ff8a4c",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        "glow-orange": "0 0 24px -4px rgba(232,100,30,0.55)",
        "glow-valid": "0 0 24px -6px rgba(46,204,143,0.6)",
        "glow-invalid": "0 0 24px -6px rgba(239,68,68,0.6)",
      },
      keyframes: {
        "cascade-fail": {
          "0%": { backgroundColor: "rgba(46,204,143,0.12)", borderColor: "#2ecc8f" },
          "100%": { backgroundColor: "rgba(239,68,68,0.12)", borderColor: "#ef4444" },
        },
        "pulse-glow": {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        "link-travel": {
          "0%": { strokeDashoffset: "24" },
          "100%": { strokeDashoffset: "0" },
        },
        "rise-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "cascade-fail": "cascade-fail 0.6s ease-out forwards",
        "pulse-glow": "pulse-glow 1.8s ease-in-out infinite",
        "link-travel": "link-travel 0.8s linear forwards",
        "rise-in": "rise-in 0.4s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
