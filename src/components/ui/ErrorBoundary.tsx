// -----------------------------------------------------------
// ErrorBoundary — Catches render errors to prevent white-screen
// -----------------------------------------------------------
// Wraps page-level and app-level components. When a child throws
// during render, shows a friendly fallback instead of crashing.
// -----------------------------------------------------------

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  /** Optional: custom fallback UI */
  fallback?: ReactNode;
  /** Optional: extra context for the error message */
  context?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(
      `[ErrorBoundary${this.props.context ? ` — ${this.props.context}` : ""}]`,
      error,
      info.componentStack
    );
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          role="alert"
          className="h-full flex items-center justify-center p-8"
        >
          <div className="max-w-md text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Something went wrong
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              {this.props.context
                ? `An error occurred in ${this.props.context}.`
                : "An unexpected error occurred."}{" "}
              Try refreshing or go back to the dashboard.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="mt-2 p-3 bg-red-50 rounded-lg text-xs text-red-700 text-left overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try again
              </button>
              <button
                onClick={() => window.location.assign("/dashboard")}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
