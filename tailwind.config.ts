import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 넉넉 디저트 브랜드 컬러
        cream: {
          50: "#FFFDF7",
          100: "#FDFBF7",
          200: "#F9F3E8",
          300: "#F2E8D5",
        },
        warm: {
          100: "#F5E6D0",
          200: "#E6D2B5",
          300: "#D4B896",
          400: "#C4A67A",
          500: "#A68B5B",
        },
        sage: {
          100: "#E8EFD5",
          200: "#C5D6A0",
          300: "#9BB86B",
          400: "#6B8E23",
          500: "#567319",
        },
        blush: {
          100: "#FFF0ED",
          200: "#FFD9D2",
          300: "#FFBCB0",
          400: "#E8998D",
        },
        charcoal: {
          100: "#8A8A8A",
          200: "#6A6A6A",
          300: "#4A4A4A",
          400: "#2A2A2A",
        },
      },
      fontFamily: {
        display: ["var(--font-playfair)", "serif"],
        body: ["var(--font-pretendard)", "sans-serif"],
      },
      animation: {
        "fade-up": "fadeUp 0.8s ease-out forwards",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
