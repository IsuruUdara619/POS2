const fs = require('fs');
const path = require('path');
const os = require('os');

class ElectronLogger {
  constructor() {
    // Force use local logs directory for development/portability
    this.logsDir = path.join(__dirname, '..', 'logs');
    
    try {
      if (!fs.existsSync(this.logsDir)) {
        fs.mkdirSync(this.logsDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create local logs directory:', error);
    }
 
    this.maxLogFiles = 10;
    this.currentLogFile = null;
    this.logBuffer = [];
    
    this.ensureLogsDirectory();
    this.createNewLogFile();
  }

  ensureLogsDirectory() {
    try {
      if (!fs.existsSync(this.logsDir)) {
        fs.mkdirSync(this.logsDir, { recursive: true });
        console.log('Created logs directory:', this.logsDir);
      }
    } catch (error) {
      console.error('Failed to create logs directory:', error);
    }
  }

  createNewLogFile() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    this.currentLogFile = path.join(this.logsDir, `electron-${timestamp}.log`);
    
    try {
      // Write initial header
      const header = `
========================================
BloomSwiftPOS Electron Log
========================================
Start Time: ${new Date().toISOString()}
OS: ${os.platform()} ${os.release()}
Arch: ${os.arch()}
Node Version: ${process.version}
Electron Version: ${process.versions.electron}
User: ${os.userInfo().username}
Home: ${os.homedir()}
========================================

`;
      fs.writeFileSync(this.currentLogFile, header);
      console.log('Created log file:', this.currentLogFile);
      
      // Clean up old log files
      this.cleanupOldLogs();
    } catch (error) {
      console.error('Failed to create log file:', error);
    }
  }

  cleanupOldLogs() {
    try {
      const files = fs.readdirSync(this.logsDir)
        .filter(f => f.startsWith('electron-') && f.endsWith('.log'))
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
            console.log('Deleted old log file:', file.name);
          } catch (error) {
            console.error('Failed to delete old log:', error);
          }
        });
      }
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }

  formatMessage(level, message, context) {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase();
    
    // Add visual indicators for severity
    const levelIndicators = {
      'CRITICAL': '🔴 CRITICAL',
      'ERROR': '❌ ERROR',
      'WARN': '⚠️  WARN',
      'INFO': 'ℹ️  INFO',
      'DEBUG': '🔍 DEBUG'
    };
    
    const levelDisplay = levelIndicators[levelUpper] || levelUpper;
    let logLine = `[${timestamp}] [${levelDisplay}] ${message}`;
    
    if (context) {
      if (typeof context === 'object') {
        logLine += '\n' + JSON.stringify(context, null, 2);
      } else {
        logLine += ' ' + context;
      }
    }
    
    return logLine + '\n';
  }

  writeToFile(message) {
    if (!this.currentLogFile) return;
    
    try {
      fs.appendFileSync(this.currentLogFile, message);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  info(message, context) {
    const formatted = this.formatMessage('info', message, context);
    console.log(message, context || '');
    this.writeToFile(formatted);
    this.logBuffer.push({ level: 'info', message, context, timestamp: new Date().toISOString() });
  }

  warn(message, context) {
    const formatted = this.formatMessage('warn', message, context);
    console.warn(message, context || '');
    this.writeToFile(formatted);
    this.logBuffer.push({ level: 'warn', message, context, timestamp: new Date().toISOString() });
  }

  error(message, context) {
    const formatted = this.formatMessage('error', message, context);
    console.error(message, context || '');
    this.writeToFile(formatted);
    this.logBuffer.push({ level: 'error', message, context, timestamp: new Date().toISOString() });
  }

  debug(message, context) {
    const formatted = this.formatMessage('debug', message, context);
    console.debug(message, context || '');
    this.writeToFile(formatted);
    this.logBuffer.push({ level: 'debug', message, context, timestamp: new Date().toISOString() });
  }

  getRecentLogs(count = 50) {
    return this.logBuffer.slice(-count);
  }

  getAllLogs() {
    return this.logBuffer;
  }

  exportLogs() {
    return JSON.stringify(this.logBuffer, null, 2);
  }

  getCurrentLogFilePath() {
    return this.currentLogFile;
  }

  getLogsDirectory() {
    return this.logsDir;
  }
}

module.exports = new ElectronLogger();
