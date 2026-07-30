import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service here
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full bg-surface-container-lowest p-8 border border-outline-variant rounded-xl shadow-sm text-center">
            <span className="material-symbols-outlined text-error text-5xl">
              error
            </span>
            <h2 className="mt-4 text-xl font-bold text-on-surface">
              Something went wrong.
            </h2>
            <p className="mt-2 text-secondary">
              Please refresh the page or try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 bg-primary text-on-primary font-label-md py-2 px-4 rounded-xl hover:bg-primary-container transition-colors"
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
