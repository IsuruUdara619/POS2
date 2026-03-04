"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class ErrorLogger {
    constructor() {
        this.logDir = path_1.default.join(process.cwd(), 'logs');
        this.errorLogFile = path_1.default.join(this.logDir, 'error.log');
        this.accessLogFile = path_1.default.join(this.logDir, 'access.log');
        // Create logs directory if it doesn't exist
        if (!fs_1.default.existsSync(this.logDir)) {
            fs_1.default.mkdirSync(this.logDir, { recursive: true });
        }
    }
    writeLog(file, data) {
        const logEntry = JSON.stringify(data) + '\n';
        fs_1.default.appendFileSync(file, logEntry);
    }
    logError(error, req, additionalInfo) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.url,
            statusCode: error.statusCode || 500,
            error: error.message,
            stack: error.stack,
            body: req.body,
            query: req.query,
            params: req.params,
            headers: {
                'user-agent': req.get('user-agent'),
                'referer': req.get('referer'),
                'content-type': req.get('content-type')
            },
            user: req.user ? {
                id: req.user.id,
                username: req.user.username
            } : undefined,
            ...additionalInfo
        };
        // Write to error log file
        this.writeLog(this.errorLogFile, errorLog);
        // Also log to console in development
        if (process.env.NODE_ENV !== 'production') {
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('🔴 ERROR LOGGED:', new Date().toISOString());
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('Method:', errorLog.method);
            console.error('URL:', errorLog.url);
            console.error('Status:', errorLog.statusCode);
            console.error('Error:', errorLog.error);
            if (errorLog.stack) {
                console.error('Stack:', errorLog.stack);
            }
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        }
    }
    logAccess(req, res, duration) {
        const accessLog = {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            user: req.user ? {
                id: req.user.id,
                username: req.user.username
            } : undefined
        };
        this.writeLog(this.accessLogFile, accessLog);
    }
    // Middleware to log all requests
    requestLogger() {
        return (req, res, next) => {
            const startTime = Date.now();
            // Log when response finishes
            res.on('finish', () => {
                const duration = Date.now() - startTime;
                this.logAccess(req, res, duration);
            });
            next();
        };
    }
    // Error handling middleware
    errorHandler() {
        return (err, req, res, next) => {
            // Log the error
            this.logError(err, req);
            // Determine status code
            const statusCode = err.statusCode || 500;
            // Send error response
            res.status(statusCode).json({
                error: err.message || 'Internal Server Error',
                statusCode,
                timestamp: new Date().toISOString(),
                path: req.url,
                ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
            });
        };
    }
    // Get recent error logs
    getRecentErrors(count = 50) {
        try {
            if (!fs_1.default.existsSync(this.errorLogFile)) {
                return [];
            }
            const content = fs_1.default.readFileSync(this.errorLogFile, 'utf-8');
            const lines = content.trim().split('\n').filter(line => line);
            const errors = lines.slice(-count).map(line => JSON.parse(line));
            return errors.reverse(); // Most recent first
        }
        catch (error) {
            console.error('Failed to read error logs:', error);
            return [];
        }
    }
    // Clear old logs
    clearOldLogs(daysToKeep = 7) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        [this.errorLogFile, this.accessLogFile].forEach(file => {
            try {
                if (!fs_1.default.existsSync(file))
                    return;
                const content = fs_1.default.readFileSync(file, 'utf-8');
                const lines = content.trim().split('\n').filter(line => line);
                const filteredLines = lines.filter(line => {
                    try {
                        const log = JSON.parse(line);
                        return new Date(log.timestamp) > cutoffDate;
                    }
                    catch {
                        return false;
                    }
                });
                fs_1.default.writeFileSync(file, filteredLines.join('\n') + '\n');
            }
            catch (error) {
                console.error(`Failed to clean log file ${file}:`, error);
            }
        });
    }
}
// Create singleton instance
const errorLogger = new ErrorLogger();
// Schedule daily cleanup of old logs
setInterval(() => {
    errorLogger.clearOldLogs();
}, 24 * 60 * 60 * 1000); // Run once per day
exports.default = errorLogger;
