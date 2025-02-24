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
        "background-main": "var(--background-main)",
        "background-secondary": "var(--background-secondary)",
        "background-tertiary": "var(--background-tertiary)",
        "text-main": "var(--text-main)",
        "text-secondary": "var(--text-secondary)",
        "text-tertiary": "var(--text-tertiary)",
        "accent-green": "var(--accent-green)",
        "accent-green-light": "var(--accent-green-light)",
        "accent-blue": "var(--accent-blue)",
        "accent-blue-light": "var(--accent-blue-light)",
        "accent-red": "var(--accent-red)",
      }
    },
  },
  plugins: [],
}
