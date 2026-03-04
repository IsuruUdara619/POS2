import React, { Component, ErrorInfo, ReactNode } from 'react';
import logger from '../services/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to our logging service
    logger.error('React Error Boundary Caught Error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorInfo: errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          padding: '40px',
          maxWidth: '800px',
          margin: '0 auto',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '40px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h1 style={{ color: '#e74c3c', fontSize: '32px', marginBottom: '16px' }}>
              ⚠️ Something went wrong
            </h1>
            <p style={{ color: '#666', fontSize: '18px', marginBottom: '24px' }}>
              The application encountered an unexpected error.
            </p>
            {this.state.error && (
              <div style={{
                background: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '24px',
                textAlign: 'left',
                overflow: 'auto'
              }}>
                <h3 style={{ color: '#333', fontSize: '16px', marginBottom: '8px' }}>
                  Error Details:
                </h3>
                <pre style={{ 
                  color: '#e74c3c', 
                  fontSize: '14px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {this.state.error.message}
                </pre>
                {this.state.error.stack && (
                  <details style={{ marginTop: '12px' }}>
                    <summary style={{ cursor: 'pointer', color: '#666' }}>
                      Stack Trace
                    </summary>
                    <pre style={{
                      fontSize: '12px',
                      color: '#666',
                      marginTop: '8px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Reload Application
              </button>
              <button
                onClick={() => {
                  const logs = logger.exportLogs();
                  const blob = new Blob([logs], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `error-logs-${Date.now()}.json`;
                  a.click();
                }}
                style={{
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Download Error Logs
              </button>
            </div>
            <p style={{ 
              color: '#999', 
              fontSize: '14px', 
              marginTop: '24px' 
            }}>
              The error has been logged. Please reload the page to continue.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
