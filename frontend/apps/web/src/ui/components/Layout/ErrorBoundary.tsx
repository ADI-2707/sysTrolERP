import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "../Button";
import styles from "./Layout.module.css";

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    if (typeof window !== "undefined") {
      void fetch("/api/telemetry/errors/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error_class: error.name || "ReactError",
          message: error.message,
          traceback: info.componentStack?.slice(0, 2000),
        }),
      }).catch(() => {});
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className={styles["error-boundary"]} role="alert">
          <h2 className={styles["error-title"]}>Something went wrong</h2>
          <p className={styles["error-desc"]}>
            An unexpected application error occurred. We have captured the event details.
          </p>
          <Button variant="primary" onClick={this.handleReload}>
            Reload Application
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
