// Comprehensive Error Logging Service

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: any;
  stack?: string;
  url?: string;
  userAgent?: string;
}

import { API_BASE_URL } from '../config';

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;
  private apiEndpoint = API_BASE_URL;

  constructor() {
    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.error('Unhandled Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled Promise Rejection', {
        reason: event.reason,
        promise: event.promise
      });
    });

    // Log resource loading errors (like missing JS files)
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        const target = event.target as HTMLElement;
        if (target.tagName === 'SCRIPT' || target.tagName === 'LINK') {
          this.error('Resource Load Error', {
            type: target.tagName,
            src: (target as any).src || (target as any).href,
            message: 'Failed to load resource'
          });
        }
      }
    }, true);
  }

  private createLogEntry(
    level: LogEntry['level'],
    message: string,
    context?: any
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    if (context) {
      entry.context = context;
      if (context.stack) {
        entry.stack = context.stack;
      }
    }

    return entry;
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Store in localStorage for persistence
    try {
      localStorage.setItem('app_logs', JSON.stringify(this.logs.slice(-50)));
    } catch (e) {
      // Ignore if localStorage is full
    }
  }

  private formatConsoleMessage(entry: LogEntry): string {
    return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
  }

  info(message: string, context?: any) {
    const entry = this.createLogEntry('info', message, context);
    this.addLog(entry);
    console.info(this.formatConsoleMessage(entry), context || '');
  }

  warn(message: string, context?: any) {
    const entry = this.createLogEntry('warn', message, context);
    this.addLog(entry);
    console.warn(this.formatConsoleMessage(entry), context || '');
  }

  error(message: string, context?: any) {
    const entry = this.createLogEntry('error', message, context);
    this.addLog(entry);
    console.error(this.formatConsoleMessage(entry), context || '');

    // Send critical errors to backend
    this.sendToBackend(entry);
  }

  debug(message: string, context?: any) {
    const entry = this.createLogEntry('debug', message, context);
    this.addLog(entry);
    console.debug(this.formatConsoleMessage(entry), context || '');
  }

  // Log API errors with full context
  logApiError(error: any, endpoint: string, method: string) {
    this.error('API Request Failed', {
      endpoint,
      method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      stack: error.stack
    });
  }

  // Log navigation events
  logNavigation(from: string, to: string) {
    this.info('Navigation', { from, to });
  }

  // Get all logs
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Get logs by level
  getLogsByLevel(level: LogEntry['level']): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  // Export logs as JSON
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Clear all logs
  clearLogs() {
    this.logs = [];
    localStorage.removeItem('app_logs');
    console.clear();
  }

  // Load logs from localStorage
  loadPersistedLogs() {
    try {
      const stored = localStorage.getItem('app_logs');
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load persisted logs', e);
    }
  }

  // Send error logs to backend
  private async sendToBackend(entry: LogEntry) {
    try {
      const token = localStorage.getItem('token');
      if (!token) return; // Don't send if not authenticated

      await fetch(`${this.apiEndpoint}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(entry)
      });
    } catch (e) {
      // Silently fail - don't want logging to break the app
      console.error('Failed to send log to backend', e);
    }
  }

  // Log performance metrics
  logPerformance(metric: string, value: number, unit: string = 'ms') {
    this.info('Performance Metric', { metric, value, unit });
  }

  // Log user actions
  logAction(action: string, details?: any) {
    this.info(`User Action: ${action}`, details);
  }
}

// Create singleton instance
const logger = new Logger();

// Load persisted logs on initialization
logger.loadPersistedLogs();

export default logger;
