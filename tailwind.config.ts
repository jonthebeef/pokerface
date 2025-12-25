import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        poker: {
          green: "#1a5f3c",
          felt: "#0d4f2b",
          gold: "#fbbf24",
        },
      },
    },
  },
  plugins: [],
};

export default config;
