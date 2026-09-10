/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dgYellow: "#FFC200",
        slate: {
          750: "#283548",
          850: "#151e2e",
          900: "#0f172a",
          950: "#020617",
        },
      },
    },
  },
  plugins: [],
};
