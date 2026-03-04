import fs from 'fs';
import path from 'path';
import os from 'os';

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' | 'DEBUG';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: any;
  stack?: string;
}

class BackendLogger {
  private logsDir: string;
  private currentLogFile: string;
  private maxLogFiles: number = 10;
  private maxLogSize: number = 5 * 1024 * 1024; // 5MB

  constructor() {
    // Use same log directory as Electron
    this.logsDir = path.join(os.homedir(), '.config', 'bloomswiftpos', 'logs');
    this.ensureLogsDirectory();
    this.currentLogFile = this.createNewLogFile();
    this.cleanupOldLogs();
  }

  private ensureLogsDirectory() {
    try {
      if (!fs.existsSync(this.logsDir)) {
        fs.mkdirSync(this.logsDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create logs directory:', error);
    }
  }

  private createNewLogFile(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const logFile = path.join(this.logsDir, `backend-${timestamp}.log`);
    
    try {
      const header = `
========================================
BloomSwiftPOS Backend Log
========================================
Start Time: ${new Date().toISOString()}
Node Version: ${process.version}
Platform: ${process.platform}
Architecture: ${process.arch}
========================================

`;
      fs.writeFileSync(logFile, header);
    } catch (error) {
      console.error('Failed to create log file:', error);
    }
    
    return logFile;
  }

  private cleanupOldLogs() {
    try {
      const files = fs.readdirSync(this.logsDir)
        .filter(f => f.startsWith('backend-') && f.endsWith('.log'))
        .map(f => ({
          name: f,
          path: path.join(this.logsDir, f),
          time: fs.statSync(path.join(this.logsDir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);

      // Keep only the most recent maxLogFiles
      if (files.length > this.maxLogFiles) {
        files.slice(this.maxLogFiles).forEach(file => {
          try {
            fs.unlinkSync(file.path);
          } catch (error) {
            console.error('Failed to delete old log:', error);
          }
        });
      }
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }

  private checkLogRotation() {
    try {
      const stats = fs.statSync(this.currentLogFile);
      if (stats.size > this.maxLogSize) {
        this.currentLogFile = this.createNewLogFile();
        this.cleanupOldLogs();
      }
    } catch (error) {
      // File doesn't exist, create new one
      this.currentLogFile = this.createNewLogFile();
    }
  }

  private formatLogEntry(level: LogLevel, message: string, context?: any): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    };

    if (context instanceof Error) {
      entry.stack = context.stack;
      entry.context = {
        name: context.name,
        message: context.message
      };
    }

    return JSON.stringify(entry) + '\n';
  }

  private writeToFile(logEntry: string) {
    try {
      this.checkLogRotation();
      fs.appendFileSync(this.currentLogFile, logEntry);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  info(message: string, context?: any) {
    const logEntry = this.formatLogEntry('INFO', message, context);
    console.log(`[INFO] ${message}`, context || '');
    this.writeToFile(logEntry);
  }

  warn(message: string, context?: any) {
    const logEntry = this.formatLogEntry('WARN', message, context);
    console.warn(`[WARN] ${message}`, context || '');
    this.writeToFile(logEntry);
  }

  error(message: string, context?: any) {
    const logEntry = this.formatLogEntry('ERROR', message, context);
    console.error(`[ERROR] ${message}`, context || '');
    this.writeToFile(logEntry);
  }

  critical(message: string, context?: any) {
    const logEntry = this.formatLogEntry('CRITICAL', message, context);
    console.error(`[CRITICAL] ${message}`, context || '');
    this.writeToFile(logEntry);
  }

  debug(message: string, context?: any) {
    const logEntry = this.formatLogEntry('DEBUG', message, context);
    console.debug(`[DEBUG] ${message}`, context || '');
    this.writeToFile(logEntry);
  }

  getLogsDirectory(): string {
    return this.logsDir;
  }
}

// Export singleton instance
export const logger = new BackendLogger();
export default logger;
