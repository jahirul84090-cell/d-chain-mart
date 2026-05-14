/** @type {import('tailwindcss').Config} */
const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./pages/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-jost)", ...fontFamily.sans],
        heading: ["var(--font-roboto-slab)", ...fontFamily.sans],
      },
      colors: {
        primary: "var(--primary)",
        foreground: "var(--foreground)",
        background: "var(--background)",
        muted: "var(--muted)",
        border: "var(--border)",
        ring: "var(--ring)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
