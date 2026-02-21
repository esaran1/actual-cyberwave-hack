const animate = require("tailwindcss-animate");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Cal Sans", "Inter", "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "#2563eb",
          foreground: "#f8fafc",
          dark: "#1d4ed8",
          light: "#dbeafe",
        },
        surface: {
          DEFAULT: "#ffffff",
          subtle: "#f8fafc",
        },
      },
      boxShadow: {
        card: "0 8px 30px rgba(37, 99, 235, 0.08)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease forwards",
      },
    },
  },
  plugins: [animate],
};
