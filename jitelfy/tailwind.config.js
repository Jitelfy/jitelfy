/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontFamily: {
      Satoshi: ["Satoshi", "sans-serif"],
      Inter: ["Inter", "sans-serif"],
    },
    extend: {
      colors: {
        "white": "var(--white)",
      }
    },
  },
  plugins: [],
}
