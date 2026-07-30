import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Shown in the header so you know which region died. */
  label?: string;
  /** Rendered instead of the default card when supplied. */
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
  info: string;
}

/**
 * Catches render-time crashes and shows the actual error.
 *
 * Without this, any throw inside a modal unmounts the whole React tree and the
 * page goes blank white, which tells you nothing. This keeps the message,
 * component stack and a recovery button on screen.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, info: '' };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Keep it in the console too, so the stack survives a reset.
    console.error(`[ErrorBoundary${this.props.label ? `: ${this.props.label}` : ''}]`, error, info);
    this.setState({ info: info.componentStack || '' });
  }

  private reset = () => this.setState({ error: null, info: '' });

  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) return this.props.fallback(error, this.reset);

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
        <div className="w-full max-w-2xl rounded-2xl border border-red-500/30 bg-[#120d0d] p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-red-400 font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded bg-red-500/10 border border-red-500/20">
              Crash
            </span>
            {this.props.label && (
              <h2 className="text-sm font-semibold text-gray-200">{this.props.label}</h2>
            )}
          </div>

          <p className="text-sm text-red-300 font-mono break-words mb-4">
            {error.name}: {error.message}
          </p>

          {info && (
            <pre className="max-h-56 overflow-auto text-[10px] leading-relaxed text-gray-500 bg-black/50 rounded-lg p-3 border border-white/5 whitespace-pre-wrap">
              {info.trim()}
            </pre>
          )}

          <div className="flex gap-3 mt-5">
            <button
              onClick={this.reset}
              className="px-5 py-2.5 rounded-lg bg-white hover:bg-red-400 text-black text-[10px] font-bold uppercase tracking-widest transition-colors"
            >
              Dismiss
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-lg border border-white/10 text-gray-400 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
