// src/components/LazyLoadErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

const MAX_RETRIES = 2;

/**
 * Error Boundary specifically for lazy-loaded components
 * Handles chunk load failures with automatic retry logic
 */
class LazyLoadErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a chunk load error
    const isChunkError =
      error.message?.includes('Failed to fetch dynamically imported module') ||
      error.message?.includes('Importing a module script failed') ||
      error.message?.includes('Loading chunk') ||
      error.name === 'ChunkLoadError';

    return {
      hasError: true,
      error,
      retryCount: isChunkError ? 0 : MAX_RETRIES, // Don't retry non-chunk errors
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('LazyLoadErrorBoundary caught error:', error, errorInfo);

    // Log to error reporting service if available
    // e.g., Sentry.captureException(error, { contexts: { errorInfo } });
  }

  handleRetry = () => {
    const { retryCount } = this.state;

    if (retryCount < MAX_RETRIES) {
      // Increment retry count and clear error
      this.setState({
        hasError: false,
        error: undefined,
        retryCount: retryCount + 1,
      });

      // Reload the page after a brief delay to allow fresh chunk fetch
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else {
      // Max retries reached, suggest manual reload
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const { componentName = 'component' } = this.props;
      const { retryCount } = this.state;
      const canRetry = retryCount < MAX_RETRIES;

      return (
        <div id="lazy-load-error-boundary" className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div id="lazy-load-error-content" className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full mb-4">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
              {canRetry ? 'Loading Issue' : 'Failed to Load'}
            </h2>
            <p className="text-gray-600 text-center mb-6">
              {canRetry
                ? `We encountered an issue loading the ${componentName}. This sometimes happens due to network conditions.`
                : `Unable to load the ${componentName} after multiple attempts.`}
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-4 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 overflow-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}
            <div className="flex gap-2">
              <button
                id="lazy-load-retry-button"
                onClick={this.handleRetry}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {canRetry ? `Retry (${retryCount}/${MAX_RETRIES})` : 'Reload Page'}
              </button>
              {canRetry && (
                <button
                  id="lazy-load-home-button"
                  onClick={() => (window.location.href = '/')}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                >
                  Go Home
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default LazyLoadErrorBoundary;
