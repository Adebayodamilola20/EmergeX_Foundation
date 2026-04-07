import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // emergex design tokens
        "emergex": {
          bg: "var(--emergex-bg)",
          "bg-elevated": "var(--emergex-bg-elevated)",
          "bg-hover": "var(--emergex-bg-hover)",
          border: "var(--emergex-border)",
          "border-focus": "var(--emergex-border-focus)",
          text: "var(--emergex-text)",
          "text-secondary": "var(--emergex-text-secondary)",
          "text-muted": "var(--emergex-text-muted)",
          accent: "var(--emergex-accent)",
          "accent-hover": "var(--emergex-accent-hover)",
          success: "var(--emergex-success)",
          warning: "var(--emergex-warning)",
          error: "var(--emergex-error)",
        },
      },
      fontFamily: {
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
