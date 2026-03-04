export interface ErrorLog {
  timestamp: string;
  message: string;
  level: 'error' | 'warn' | 'info';
  stack?: string;
  url?: string;
  userAgent?: string;
  context?: any;
}

class ErrorReporter {
  private errorBuffer: ErrorLog[] = [];
  private maxBufferSize: number = 100;

  constructor() {
    this.setupGlobalErrorHandlers();
  }

  private setupGlobalErrorHandlers() {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.reportError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        context: {
          lineno: event.lineno,
          colno: event.colno,
          type: 'uncaught_error'
        }
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        context: {
          type: 'unhandled_rejection',
          reason: event.reason
        }
      });
    });
  }

  reportError(error: {
    message: string;
    stack?: string;
    url?: string;
    context?: any;
  }) {
    const errorReport: ErrorLog = {
      timestamp: new Date().toISOString(),
      message: error.message,
      level: 'error',
      stack: error.stack,
      url: error.url || window.location.href,
      userAgent: navigator.userAgent,
      context: error.context
    };

    // Add to buffer
    this.errorBuffer.push(errorReport);
    if (this.errorBuffer.length > this.maxBufferSize) {
      this.errorBuffer.shift(); // Remove oldest
    }

    // Log to console
    console.error('[ErrorReporter]', errorReport);

    // Send to Electron if available
    if (window.electronAPI?.logError) {
      window.electronAPI.logError({
        level: 'error',
        message: error.message,
        context: {
          stack: error.stack,
          url: error.url,
          ...error.context
        }
      });
    }
  }

  reportWarning(message: string, context?: any) {
    const warning: ErrorLog = {
      timestamp: new Date().toISOString(),
      message,
      level: 'warn',
      url: window.location.href,
      userAgent: navigator.userAgent,
      context
    };

    // Add to buffer
    this.errorBuffer.push(warning);
    if (this.errorBuffer.length > this.maxBufferSize) {
      this.errorBuffer.shift();
    }

    console.warn('[ErrorReporter]', warning);

    if (window.electronAPI?.logError) {
      window.electronAPI.logError({
        level: 'warn',
        message,
        context
      });
    }
  }

  reportInfo(message: string, context?: any) {
    const info: ErrorLog = {
      timestamp: new Date().toISOString(),
      message,
      level: 'info',
      url: window.location.href,
      userAgent: navigator.userAgent,
      context
    };

    // Add to buffer
    this.errorBuffer.push(info);
    if (this.errorBuffer.length > this.maxBufferSize) {
      this.errorBuffer.shift();
    }

    console.log('[ErrorReporter]', info);

    if (window.electronAPI?.logError) {
      window.electronAPI.logError({
        level: 'info',
        message,
        context
      });
    }
  }

  getRecentErrors(count: number = 20): ErrorLog[] {
    return this.errorBuffer.slice(-count);
  }

  getRecentLogs(): ErrorLog[] {
    return [...this.errorBuffer];
  }

  clearErrors() {
    this.errorBuffer = [];
  }

  clearLogs() {
    this.errorBuffer = [];
  }
}

// Create singleton instance
export const errorReporter = new ErrorReporter();
export default errorReporter;

// Add type declarations for window.electronAPI
declare global {
  interface Window {
    electronAPI?: {
      logError?: (log: { level: string; message: string; context?: any }) => void;
      openLogsFolder?: () => void;
      getDiagnostics?: () => Promise<any>;
    };
  }
}
