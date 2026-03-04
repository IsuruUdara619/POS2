# Error Handling & Diagnostic System

## Overview

BloomSwiftPOS now includes a **comprehensive error handling and diagnostic system** that provides detailed information about application startup and runtime errors. This system makes it easy to diagnose issues like the "yellow screen" problem.

---

## Features

### 🔍 Real-Time Diagnostics
- **Startup Progress Tracking**: See each step of the startup process
- **Status Indicators**: Visual feedback for each component (✅ Success, ❌ Error, ⏳ Loading)
- **Detailed Error Messages**: Clear explanations of what went wrong
- **Stack Traces**: Full technical details for debugging

### 📝 File-Based Logging
- **Persistent Logs**: All logs saved to `~/.config/bloomswiftpos/logs/`
- **Rotating Log Files**: Keeps last 10 log files automatically
- **System Information**: OS, Node version, Electron version logged
- **Timestamped Entries**: Every log entry has a precise timestamp

### 🛠️ Diagnostic Window
- **Interactive UI**: User-friendly diagnostic screen
- **One-Click Actions**: Copy logs, save reports, retry startup
- **Direct Folder Access**: Open logs folder with one click
- **Export Reports**: Generate comprehensive diagnostic reports

---

## Components

### 1. Electron Logger (`electron/logger.js`)

A sophisticated logging system that:
- Creates log files in `~/.config/bloomswiftpos/logs/`
- Maintains a circular buffer of recent logs in memory
- Automatically cleans up old log files
- Provides different log levels (info, warn, error, debug)

**Usage:**
```javascript
const logger = require('./logger');

logger.info('Application started');
logger.warn('Configuration missing', { key: 'DATABASE_URL' });
logger.error('Failed to connect', { error: err.message });
```

### 2. Diagnostic Window (`electron/diagnostic.html`)

An HTML-based diagnostic interface that shows:
- Real-time startup progress
- Success/failure status for each component
- Detailed error information with stack traces
- System information and log file location

### 3. Enhanced Main Process (`electron/main.js`)

The main Electron process now includes:
- Comprehensive try-catch error handling
- Status tracking for each startup phase
- Backend console output interception
- Automatic diagnostic window display on errors
- IPC handlers for diagnostic data

### 4. Improved Backend (`backend/index.ts`)

Backend initialization now features:
- Detailed logging at each step
- Clear error messages with context
- Database connection validation
- Admin user setup verification

---

## How It Works

### Startup Sequence

1. **Electron Initialization**
   - Logger creates new log file
   - Diagnostic state tracker initialized
   - Status: "Electron initialized"

2. **Configuration Loading**
   - Load DATABASE_URL and JWT_SECRET from electron-store
   - Status: "Configuration loaded"

3. **Diagnostic Window Creation**
   - Creates diagnostic window (hidden initially)
   - Ready to show if any errors occur

4. **Backend Server Start**
   - Set environment variables
   - Load backend module (TypeScript in dev, JavaScript in production)
   - Intercept console.log/console.error for status updates
   - Status: "Backend server started"

5. **Database Connection**
   - Initialize connection pool
   - Create/verify database tables
   - Set up admin user
   - Status: "Database connected"

6. **Backend Health Check**
   - HTTP request to backend to verify it's responding
   - Status: "Backend healthy"

7. **Frontend Loading**
   - Create main application window
   - Load frontend assets (built files or Vite dev server)
   - Status: "Frontend loaded"

8. **Success or Failure**
   - If all successful: Show main window, close diagnostic window
   - If any errors: Keep/show diagnostic window with error details

---

## Log File Locations

### Development
```
~/.config/bloomswiftpos/logs/
├── electron-2026-01-27T12-30-00.log
├── electron-2026-01-27T11-15-00.log
├── diagnostic-report-2026-01-27T12-45-00.txt
└── ...
```

### Production (Installed App)
Same location: `~/.config/bloomswiftpos/logs/`

Log files are named with timestamps: `electron-YYYY-MM-DDTHH-MM-SS.log`

---

## Diagnostic Window Features

### Status Display
Each component shows:
- ✅ **Success**: Component initialized successfully
- ❌ **Error**: Component failed with error message
- ⏳ **Loading**: Component currently initializing

### Error Details
When an error occurs:
- Error message displayed prominently
- Stack trace available (click to expand)
- Additional context shown (if available)

### Action Buttons

#### 🔄 Retry Startup
Restarts the entire application (app.relaunch())

#### 📋 Copy Error Details
Copies full diagnostic report to clipboard

#### 💾 Save Diagnostic Report
Saves detailed report to logs folder as `.txt` file

#### 📁 Open Log Folder
Opens the logs directory in file manager

---

## Common Error Scenarios

### 1. Database Connection Failure

**Symptoms:**
- Diagnostic shows "❌ Database Connection: Database connection failed"
- Error message: "ECONNREFUSED" or "connection refused"

**Solutions:**
- Check if PostgreSQL is running: `sudo systemctl status postgresql`
- Start PostgreSQL: `sudo systemctl start postgresql`
- Verify DATABASE_URL in electron-store
- Check if database exists and user has permissions

**Log Location:**
Check `~/.config/bloomswiftpos/logs/electron-*.log` for full details

---

### 2. Backend Initialization Error

**Symptoms:**
- Diagnostic shows "❌ Backend Server: Initialization failed"
- Error about missing modules or permission errors

**Solutions:**
- Ensure backend dependencies are installed: `cd backend && npm install`
- Check backend has been compiled: `npm run build:backend`
- Verify environment variables are set correctly
- Check file permissions on backend directory

---

### 3. Frontend Load Failure

**Symptoms:**
- Diagnostic shows "❌ Frontend Load: Failed to load"
- Yellow or blank screen

**Solutions:**
- In production: Ensure frontend was built: `npm run build:frontend`
- In development: Ensure Vite dev server is running on port 5173
- Check if frontend-build directory exists and has files
- Verify no port conflicts

---

### 4. WhatsApp Service Errors

**Symptoms:**
- Permission errors related to `.wwebjs_auth` directory
- "EACCES: permission denied" errors

**Solutions:**
- WhatsApp now initializes manually (not on startup)
- Data stored in `~/.config/bloomswiftpos/.wwebjs_auth/`
- Run: `mkdir -p ~/.config/bloomswiftpos/.wwebjs_auth && chmod 755 ~/.config/bloomswiftpos/.wwebjs_auth`

---

## Diagnostic Report Format

When you save a diagnostic report, it includes:

```
========================================
BloomSwiftPOS Diagnostic Report
========================================
Generated: 2026-01-27T12:45:00.000Z
OS: linux 6.14
Node: v18.16.0
Electron: 28.2.0
========================================

STARTUP STATUS:
----------------------------------------
✅ Electron initialized
✅ Configuration loaded
✅ Backend Server: Running on port 5000
✅ Database Connection: Connected successfully
❌ Frontend Load: Failed to load

========================================
ERROR DETAILS:
========================================
Frontend load failed: ERR_FILE_NOT_FOUND

Stack Trace:
  at BrowserWindow.loadFile (...)
  at createWindow (...)
  ...

Context:
{
  "errorCode": -6,
  "errorDescription": "ERR_FILE_NOT_FOUND"
}

========================================
RECENT LOGS:
========================================
[2026-01-27T12:45:00.000Z] [INFO] Starting backend server...
[2026-01-27T12:45:01.000Z] [INFO] Backend: Database pool initialized
[2026-01-27T12:45:02.000Z] [ERROR] Frontend failed to load
...
```

---

## Developer Tips

### Viewing Logs in Real-Time

**Terminal (Development):**
```bash
tail -f ~/.config/bloomswiftpos/logs/electron-*.log
```

**View latest log:**
```bash
cat $(ls -t ~/.config/bloomswiftpos/logs/electron-*.log | head -1)
```

### Adding Custom Logging

**In Electron main process:**
```javascript
logger.info('Custom event', { data: 'value' });
logger.error('Something failed', { error: err.message });
```

**In Backend:**
```javascript
console.log('✅ Custom step completed');
console.error('❌ Custom step failed:', error);
```

These will be captured by the diagnostic system.

### Testing Error Handling

To test the error handling system:

1. **Simulate DB error:**
   - Set invalid DATABASE_URL in electron-store
   - Restart app
   - Diagnostic window should show database error

2. **Simulate backend error:**
   - Rename backend/dist folder
   - Restart app
   - Diagnostic window should show backend load error

3. **Simulate frontend error:**
   - Rename frontend-build folder
   - Restart app in production mode
   - Diagnostic window should show frontend load error

---

## Building with Error Handling

The error handling system is automatically included when you build:

```bash
# Build everything
npm run build:all

# Build .deb package
npm run electron:build:deb

# Build AppImage
npm run electron:build:appimage
```

Files included in build:
- `electron/logger.js` - Logging system
- `electron/diagnostic.html` - Diagnostic UI
- `electron/main.js` - Enhanced main process

---

## Troubleshooting the Error Handler

If the diagnostic system itself has issues:

### Logs not being created
- Check permissions: `ls -la ~/.config/bloomswiftpos/`
- Create manually: `mkdir -p ~/.config/bloomswiftpos/logs`
- Check disk space: `df -h ~`

### Diagnostic window not showing
- Check Electron DevTools console (Ctrl+Shift+I in development)
- Verify `electron/diagnostic.html` exists
- Check for JavaScript errors in diagnostic.html

### Status not updating
- Verify logger is imported: `const logger = require('./logger');`
- Check console for logger errors
- Ensure `updateDiagnosticStatus()` is being called

---

## Future Enhancements

Possible improvements to consider:

- [ ] Remote error reporting (send logs to server)
- [ ] Performance metrics tracking
- [ ] User action logging (anonymized)
- [ ] Automatic error recovery attempts
- [ ] Email notifications for critical errors
- [ ] Integration with error tracking services (Sentry, etc.)

---

## Technical Details

### Log File Structure

Each log file starts with a header:
```
========================================
BloomSwiftPOS Electron Log
========================================
Start Time: 2026-01-27T12:45:00.000Z
OS: linux 6.14
Arch: x64
Node Version: v18.16.0
Electron Version: 28.2.0
User: username
Home: /home/username
========================================
```

Followed by timestamped log entries:
```
[2026-01-27T12:45:00.000Z] [INFO] Starting backend server...
[2026-01-27T12:45:01.000Z] [ERROR] Failed to connect
{
  "error": "ECONNREFUSED",
  "code": -1
}
```

### IPC Channels

New IPC channels for diagnostics:
- `get-diagnostic-data` - Returns current diagnostic state
- `save-diagnostic-report` - Saves report to file
- `retry-startup` - Relaunches application
- `open-logs-folder` - Opens logs directory

---

## Questions?

If you encounter issues with the error handling system:

1. Check the logs: `~/.config/bloomswiftpos/logs/`
2. Run the app from terminal to see console output
3. Use the diagnostic window's "Save Diagnostic Report" button
4. Include the diagnostic report when reporting issues

**Remember:** The error handling system is designed to help diagnose issues, not hide them. If you see an error, it means the system is working correctly by alerting you to a problem that needs fixing!
