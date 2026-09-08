import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        paper: "var(--paper)",
        panel: "var(--panel)",
        line: "var(--line)",
        accent: "var(--accent)",
        muted: "var(--muted)",
      },
      boxShadow: { panel: "0 8px 30px rgba(21, 31, 28, .06)" },
    },
  },
  plugins: [],
};

export default config;
