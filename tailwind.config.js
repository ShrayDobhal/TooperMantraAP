/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#0b0f17",
        cardBg: "#151c2c",
        cardBorder: "#1e293b",
        accentCyan: "#06b6d4",
        accentViolet: "#8b5cf6",
      },
    },
  },
  plugins: [],
};
