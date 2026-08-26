/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2663EB",
          dark: "#1D4ED8",
          light: "#3B82F6",
        },
        accent: {
          DEFAULT: "#17A34A",
          dark: "#15803D",
        },
      },
    },
  },
  plugins: [],
};
