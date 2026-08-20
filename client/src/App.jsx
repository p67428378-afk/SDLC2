import React from "react";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";

export default function App() {
  return (
    <ThemeProvider>
      <DashboardPage />
    </ThemeProvider>
  );
}
