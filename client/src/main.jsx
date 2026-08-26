import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Error Boundary caught error
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f7fafc] p-6">
          <div className="max-w-md w-full bg-white p-8 rounded-xl border border-red-200 shadow-md text-center">
            <h2 className="text-xl font-bold text-red-600 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              An unexpected error occurred while rendering the application.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#2663eb] text-white text-xs font-bold rounded-lg shadow-sm hover:bg-[#1d4ed8] transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
