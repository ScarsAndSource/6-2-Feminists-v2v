import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackLabel?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] caught render error:', error.message, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-16 px-6 animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-coral-500/10 border border-coral-500/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-coral-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {this.props.fallbackLabel || 'Something went wrong displaying this'}
          </h3>
          <p className="text-slate-400 mb-6 max-w-sm mx-auto text-sm">
            Your data is safe. Try again, or refresh the page.
          </p>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
