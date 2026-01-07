import { type ReactNode } from 'react';
import { ErrorBoundary as ReactErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { ErrorDisplay } from './ErrorDisplay';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

function Fallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <ErrorDisplay
      message={error.message || 'Unknown error'}
      details={error.stack}
      onRetry={resetErrorBoundary}
    />
  );
}

export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  return (
    <ReactErrorBoundary
      FallbackComponent={fallback ? () => <>{fallback}</> : Fallback}
    >
      {children}
    </ReactErrorBoundary>
  );
}
