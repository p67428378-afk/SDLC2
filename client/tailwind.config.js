/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#2663EB",
          accent: "#EB9917",
          surface: "#FFFFFF",
          background: "#F7FAFC",
          text: "#171C29",
          muted: "#707A8C",
          border: "#E3E8F0",
          success: "#17A34A",
          warning: "#EB9917",
          error: "#DB2626",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
