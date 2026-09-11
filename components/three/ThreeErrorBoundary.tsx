import { Component, ErrorInfo, ReactNode } from "react";

type ThreeErrorBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
  onError?: (error: Error) => void;
};

type ThreeErrorBoundaryState = {
  error: Error | null;
};

export class ThreeErrorBoundary extends Component<
  ThreeErrorBoundaryProps,
  ThreeErrorBoundaryState
> {
  state: ThreeErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): ThreeErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error);

    if (__DEV__) {
      console.warn("Three.js decoration could not be rendered.", error, info);
    }
  }

  render() {
    if (this.state.error) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
