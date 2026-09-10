import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
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
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
          <div className="bg-slate-800 border border-rose-500/50 p-6 rounded-lg max-w-lg w-full text-center">
            <h2 className="text-xl font-bold text-rose-400 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-slate-300 mb-4">
              An unexpected error occurred while rendering the dashboard.
            </p>
            <p className="text-xs font-mono text-slate-400 bg-slate-900 p-3 rounded overflow-x-auto text-left">
              {this.state.error?.message || "Unknown error"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-[#FFC200] text-slate-900 font-bold px-4 py-2 rounded text-sm hover:bg-[#e0b000] transition-colors"
            >
              Reload Page
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
