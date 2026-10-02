import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { sanitizeErrorMessage } from '../utils/errorSanitizer';

/**
 * Top-Level Error Boundary Component
 * Catches unhandled React render crashes and presents a polished Midnight Glass fallback screen
 * without exposing stack traces or sensitive internal paths to the DOM.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      sanitizedError: '',
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      sanitizedError: sanitizeErrorMessage(error, 'An unexpected rendering error occurred.'),
    };
  }

  componentDidCatch(error, errorInfo) {
    // In production or development, log securely to console for debugging
    console.error('ErrorBoundary caught an unhandled exception:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#060b18] via-[#0a0f1e] to-[#060b18] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden text-slate-100">
          {/* Background Ambient Glow */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-lg w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-500/20 text-red-400 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-red-500/10">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              An unexpected error occurred while rendering the workspace. Your data and changes are safe.
            </p>

            {this.state.sanitizedError && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 text-left font-mono break-words">
                {this.state.sanitizedError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-[0.99]"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Workspace
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-medium rounded-xl text-sm transition-all"
              >
                <Home className="w-4 h-4 mr-2" />
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
