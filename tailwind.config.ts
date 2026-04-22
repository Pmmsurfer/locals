import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "rgb(244 244 240 / <alpha-value>)",
        surface: "rgb(255 255 255 / <alpha-value>)",
        foreground: "rgb(26 26 24 / <alpha-value>)",
        muted: "rgb(136 136 128 / <alpha-value>)",
        accent: "rgb(27 63 240 / <alpha-value>)",
        hosting: "rgb(232 238 255 / <alpha-value>)",
        border: {
          DEFAULT: "#DDDDD8",
        },
        card: {
          border: "#E8E8E4",
        },
      },
      fontFamily: {
        sans: ["var(--font-nunito)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
        button: "8px",
      },
    },
  },
  plugins: [],
};
export default config;
