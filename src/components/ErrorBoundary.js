import React from 'react';
import { AlertTriangle, RefreshCw, ChevronDown } from 'lucide-react';

/**
 * ErrorBoundary — catches render errors from any child component.
 *
 * Without this, a single unexpected API response shape can crash the entire app
 * to a blank white screen with no recovery path.
 *
 * Usage:
 *   <ErrorBoundary serviceName="S3">
 *     <S3Page ... />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, showStack: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console for debugging — could hook into a telemetry service here
    console.error('[LocalStack Desktop] Page error:', error, info.componentStack);
  }

  reset = () => {
    this.setState({ hasError: false, error: null, showStack: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error, showStack } = this.state;
    const { serviceName = 'this page' } = this.props;
    const message = error?.message || String(error);
    const stack   = error?.stack;

    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '80px 40px', gap: 16, textAlign: 'center',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(229,62,62,0.1)', border: '2px solid rgba(229,62,62,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <AlertTriangle size={28} color="var(--aws-red)" />
        </div>

        <div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--aws-text)', marginBottom: 8 }}>
            Something went wrong in {serviceName}
          </h3>
          <p style={{
            fontSize: 13, color: 'var(--aws-text-muted)', maxWidth: 460, lineHeight: 1.6,
          }}>
            {serviceName} returned an unexpected response or encountered a rendering error.
            This is usually caused by an API shape mismatch — try refreshing, or check that
            LocalStack is running correctly.
          </p>
        </div>

        {/* Error message */}
        <div style={{
          padding: '10px 16px', borderRadius: 6, maxWidth: 500, width: '100%',
          background: 'var(--aws-surface-2)', border: '1px solid rgba(229,62,62,0.3)',
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--aws-red)', textAlign: 'left',
          wordBreak: 'break-all',
        }}>
          {message}
        </div>

        {/* Stack trace toggle */}
        {stack && (
          <div style={{ width: '100%', maxWidth: 500 }}>
            <button
              onClick={() => this.setState(s => ({ showStack: !s.showStack }))}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--aws-text-muted)', fontSize: 12, fontFamily: 'var(--font-main)',
                marginBottom: 6,
              }}
            >
              <ChevronDown
                size={13}
                style={{ transform: showStack ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              />
              {showStack ? 'Hide' : 'Show'} stack trace
            </button>
            {showStack && (
              <pre style={{
                padding: 12, borderRadius: 6, textAlign: 'left',
                background: 'var(--aws-surface-3)', border: '1px solid var(--aws-border)',
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: 'var(--aws-text-muted)', overflow: 'auto',
                maxHeight: 200, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
              }}>
                {stack}
              </pre>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button className="btn btn-primary" onClick={this.reset}>
            <RefreshCw size={13} /> Try again
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => window.location.reload()}
          >
            Reload app
          </button>
        </div>
      </div>
    );
  }
}
