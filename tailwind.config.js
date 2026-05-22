/** @type {import('tailwindcss').Config} */
const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,jsx,ts,tsx,mdx}",
    "./src/components/**/*.{js,jsx,ts,tsx,mdx}",
    "./src/app/**/*.{js,jsx,ts,tsx,mdx}",
    "./src/lib/**/*.{js,jsx,ts,tsx,mdx}",
    "./src/**/*.{js,jsx,ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-jost)", ...fontFamily.sans],
        heading: ["var(--font-roboto-slab)", ...fontFamily.sans],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};