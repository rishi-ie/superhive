/**
 * ErrorBoundary — catches React render errors in a subtree and renders a fallback
 * instead of crashing the entire owning panel.
 *
 * Uses the legacy React error-boundary API (componentDidCatch) so it works
 * with React 18 strict mode double-render.
 */
import React, { Component, type ReactNode } from 'react';

type ErrorBoundaryProps = {
  children: ReactNode;
  /** Shown when a child throws during render. */
  fallback?: ReactNode;
  /** Called with the error whenever a child throws. */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

/**
 * Catches render errors in its children and displays a fallback.
 * @param children - The child tree to guard
 * @param fallback - UI to show when an error is caught (default: empty div)
 * @param onError  - Optional callback for logging/monitoring
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.warn('[ErrorBoundary] caught render error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
