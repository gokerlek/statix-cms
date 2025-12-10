"use client";

import { Component, ReactNode } from "react";

import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import ui from "@/content/ui.json";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>

          <div className="text-center">
            <h2 className="text-xl font-semibold">{ui.errorBoundary.title}</h2>

            <p className="mt-2 text-muted-foreground">
              {ui.errorBoundary.description}
            </p>

            {this.state.error && (
              <p className="mt-2 text-sm text-muted-foreground font-mono">
                {this.state.error.message}
              </p>
            )}
          </div>

          <Button onClick={this.handleReset} variant="outline" className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            {ui.errorBoundary.retry}
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
