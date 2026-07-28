/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#006c49",
          container: "#10b981",
          "on-container": "#00422b",
        },
        secondary: {
          DEFAULT: "#565e74",
          container: "#dae2fd",
        },
        error: {
          DEFAULT: "#ba1a1a",
          container: "#ffdad6",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
