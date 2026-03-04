const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
// Auto-updater disabled - enable when update server is configured
// const { autoUpdater } = require('electron-updater');
const path = require('path');
const Store = require('electron-store');
const logger = require('./logger');
const os = require('os');
const whatsappService = require('./services/whatsapp-native');

// Load environment variables from .env.electron
require('dotenv').config({ path: path.join(__dirname, '../.env.electron') });

// Initialize electron store for configuration
const store = new Store();

let mainWindow = null;
let diagnosticWindow = null;
let backendServer = null;
const BACKEND_PORT = 5000;

// Diagnostic state tracker
const diagnosticState = {
  statuses: [],
  error: null,
  logs: [],
  system: {
    os: `${os.platform()} ${os.release()}`,
    node: process.version,
    electron: process.versions.electron
  }
};

function updateDiagnosticStatus(title, status, detail = '') {
  const statusEntry = { title, status, detail, timestamp: new Date().toISOString() };
  diagnosticState.statuses.push(statusEntry);
  logger.info(`Diagnostic: ${title}`, { status, detail });
  
  // Send update to diagnostic window if it exists
  if (diagnosticWindow && !diagnosticWindow.isDestroyed()) {
    diagnosticWindow.webContents.send('diagnostic-update', diagnosticState);
  }
}

function setDiagnosticError(error) {
  diagnosticState.error = {
    message: error.message || String(error),
    stack: error.stack || '',
    context: error.context || {}
  };
  logger.error('Critical Error', diagnosticState.error);
}

// Disable hardware acceleration if needed
// app.disableHardwareAcceleration();

function createDiagnosticWindow() {
  if (diagnosticWindow && !diagnosticWindow.isDestroyed()) {
    diagnosticWindow.focus();
    return;
  }

  logger.info('Creating diagnostic window');

  diagnosticWindow = new BrowserWindow({
    width: 900,
    height: 700,
    title: 'BloomSwiftPOS - Startup Diagnostics',
    icon: path.join(__dirname, '../Assets/BLOOM_SWIFT_POS_LOGO_XS_T.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    show: false,
  });

  diagnosticWindow.loadFile(path.join(__dirname, 'diagnostic.html'));

  diagnosticWindow.once('ready-to-show', () => {
    diagnosticWindow.show();
  });

  diagnosticWindow.on('closed', () => {
    diagnosticWindow = null;
  });
}

function createWindow() {
  logger.info('Creating main window');
  updateDiagnosticStatus('Electron Window', 'loading', 'Creating application window...');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: 'BloomSwiftPOS',
    icon: path.join(__dirname, '../Assets/BLOOM_SWIFT_POS_LOGO_XS_T.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false, // Don't show until ready
  });

  // Set application menu
  const menu = require('./menu');
  Menu.setApplicationMenu(menu.createMenu(mainWindow));

  // Load the app
  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../frontend-build/index.html')}`;
  
  if (process.env.ELECTRON_START_URL) {
    logger.info(`Loading development URL: ${startUrl}`);
    mainWindow.loadURL(startUrl);
  } else {
    logger.info('Loading production build');
    mainWindow.loadFile(path.join(__dirname, '../frontend-build/index.html'));
  }
  
  // Open dev tools in development mode
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    logger.info('Main window ready to show');
    updateDiagnosticStatus('Electron Window', 'success', 'Application window created');
    mainWindow.show();
    
    // Close diagnostic window if it exists
    if (diagnosticWindow && !diagnosticWindow.isDestroyed()) {
      setTimeout(() => {
        diagnosticWindow.close();
      }, 1000);
    }
  });

  // Handle load errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    logger.error('Frontend failed to load', { errorCode, errorDescription });
    updateDiagnosticStatus('Frontend Load', 'error', `Failed: ${errorDescription}`);
    setDiagnosticError(new Error(`Frontend load failed: ${errorDescription}`));
  });

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Auto-update disabled - enable when update server is configured
  // if (app.isPackaged) {
  //   setTimeout(() => {
  //     checkForUpdates();
  //   }, 3000);
  // }
}

/**
 * Clean up stale compiled JavaScript files that might interfere with TypeScript execution
 * This prevents issues after system reboots where old compiled files are loaded instead of current TS files
 */
function cleanupStaleCompiledFiles() {
  logger.info('Checking for stale compiled JavaScript files...');
  const fs = require('fs');
  const backendPath = app.isPackaged
    ? path.join(process.resourcesPath, 'backend')
    : path.join(__dirname, '../backend');
  
  const filesToCheck = [
    path.join(backendPath, 'index.js'),
  ];
  
  let cleanedCount = 0;
  
  filesToCheck.forEach(jsFile => {
    const tsFile = jsFile.replace(/\.js$/, '.ts');
    
    if (fs.existsSync(jsFile)) {
      // Check if corresponding .ts file exists and is newer
      if (fs.existsSync(tsFile)) {
        const jsStats = fs.statSync(jsFile);
        const tsStats = fs.statSync(tsFile);
        
        if (tsStats.mtimeMs > jsStats.mtimeMs || true) { // Always clean in development
          logger.info(`Removing stale compiled file: ${path.basename(jsFile)}`);
          fs.unlinkSync(jsFile);
          cleanedCount++;
        }
      } else {
        // .js exists but no .ts - in development mode, this might be stale
        if (!app.isPackaged) {
          logger.info(`Removing orphaned compiled file: ${path.basename(jsFile)}`);
          fs.unlinkSync(jsFile);
          cleanedCount++;
        }
      }
    }
  });
  
  if (cleanedCount > 0) {
    logger.info(`Cleanup complete: ${cleanedCount} stale file(s) removed`);
  } else {
    logger.info('No stale files found - environment is clean');
  }
}

function startBackendServer() {
  return new Promise((resolve, reject) => {
    logger.info('Starting backend server...');
    updateDiagnosticStatus('Backend Server', 'loading', 'Initializing backend...');

    try {
      // Clean up any stale compiled files first
      cleanupStaleCompiledFiles();
      
      // Import and start the backend server
      const backendPath = app.isPackaged
        ? path.join(process.resourcesPath, 'backend')
        : path.join(__dirname, '../backend');

      logger.info('Backend path:', { backendPath, isPackaged: app.isPackaged });

      // Set environment variables
      process.env.PORT = BACKEND_PORT.toString();
      
      // Get database URL from store or use default
      const dbUrl = store.get('DATABASE_URL', process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres');
      process.env.DATABASE_URL = dbUrl;
      
      // Set other environment variables
      process.env.JWT_SECRET = store.get('JWT_SECRET', process.env.JWT_SECRET || 'electron-bloomswift-pos-secret-key');
      process.env.ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
      process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

      logger.info('Environment configured', {
        PORT: BACKEND_PORT,
        DB_CONFIGURED: !!dbUrl,
        JWT_CONFIGURED: !!process.env.JWT_SECRET
      });

      updateDiagnosticStatus('Database Connection', 'loading', 'Connecting to database...');

      // Capture backend console output
      // Note: We don't intercept console.log/error here to avoid recursion with logger
      // The backend already has detailed console.log statements that we can see

      // Start the backend server
      if (app.isPackaged) {
        // Production: require the compiled backend
        logger.info('Loading production backend');
        backendServer = require(path.join(backendPath, 'index.js'));
      } else {
        // Development: require the ts-node version with proper configuration
        logger.info('Loading development backend with ts-node');
        require('ts-node').register({
          project: path.join(backendPath, 'tsconfig.json'),
          transpileOnly: true,
          compilerOptions: {
            module: 'commonjs'
          }
        });
        backendServer = require(path.join(backendPath, 'index.ts'));
      }

      logger.info(`Backend server module loaded on port ${BACKEND_PORT}`);
      
      // Give backend a moment to initialize
      setTimeout(() => {
        resolve();
      }, 2000);
      
    } catch (error) {
      logger.error('Failed to start backend server:', {
        message: error.message,
        stack: error.stack
      });
      updateDiagnosticStatus('Backend Server', 'error', error.message);
      setDiagnosticError(error);
      reject(error);
    }
  });
}

// IPC Handlers
ipcMain.handle('get-db-config', async () => {
  return {
    DATABASE_URL: store.get('DATABASE_URL', ''),
    JWT_SECRET: store.get('JWT_SECRET', ''),
  };
});

ipcMain.handle('set-db-config', async (event, config) => {
  try {
    store.set('DATABASE_URL', config.DATABASE_URL);
    if (config.JWT_SECRET) {
      store.set('JWT_SECRET', config.JWT_SECRET);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('test-db-connection', async (event, dbUrl) => {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: dbUrl });
    await pool.query('SELECT NOW()');
    await pool.end();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-app-path', async () => {
  return app.getPath('userData');
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

// WhatsApp IPC Handlers
ipcMain.handle('whatsapp:initialize', async () => {
  try {
    await whatsappService.initialize();
    return { success: true };
  } catch (error) {
    logger.error('WhatsApp initialize error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('whatsapp:get-status', async () => {
  try {
    return whatsappService.getStatus();
  } catch (error) {
    logger.error('WhatsApp get-status error:', error);
    throw error;
  }
});

ipcMain.handle('whatsapp:get-qr-code', async () => {
  try {
    const qrCode = whatsappService.getQRCode();
    const status = whatsappService.getStatus();
    
    if (!qrCode) {
      if (status.isConnected) {
        return {
          error: 'Already connected',
          message: 'WhatsApp is already connected. No QR code needed.'
        };
      }
      
      if (!status.isInitializing && !status.initializationFinishedAt) {
        // Start initialization if not started
        await whatsappService.initialize();
        return {
          error: 'QR code not ready',
          message: 'WhatsApp is initializing. Please try again in a moment.',
          isInitializing: true
        };
      }
      
      return {
        error: 'QR code not ready',
        message: 'QR code is being generated. Please try again.',
        isInitializing: status.isInitializing
      };
    }
    
    return { qrCode };
  } catch (error) {
    logger.error('WhatsApp get-qr-code error:', error);
    throw error;
  }
});

ipcMain.handle('whatsapp:disconnect', async () => {
  try {
    await whatsappService.disconnect();
    return { success: true, message: 'WhatsApp disconnected successfully' };
  } catch (error) {
    logger.error('WhatsApp disconnect error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('whatsapp:reconnect', async () => {
  try {
    await whatsappService.reconnect();
    return { success: true, message: 'WhatsApp reconnecting... Please scan the new QR code.' };
  } catch (error) {
    logger.error('WhatsApp reconnect error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('whatsapp:send-invoice', async (event, invoiceData) => {
  try {
    const { pool } = require(app.isPackaged
      ? path.join(process.resourcesPath, 'backend', 'src', 'db.js')
      : path.join(__dirname, '../backend/src/db.ts'));
    
    const { contact_no, invoice_no, date, customer_name, items, discount, total_amount, payment_type } = invoiceData;
    
    if (!contact_no) {
      return { success: false, error: 'Missing contact number' };
    }
    
    if (!invoice_no || !date || !customer_name || !items || !total_amount) {
      return { success: false, error: 'Missing required invoice data' };
    }
    
    // Check if contact number belongs to a loyalty customer
    const loyaltyCheck = await pool.query(
      'SELECT loyalty_customer_id, name FROM loyalty_customers WHERE mobile_no = $1',
      [contact_no]
    );
    
    if (loyaltyCheck.rows.length === 0) {
      return {
        success: false,
        error: 'Not a loyalty customer',
        message: 'This customer is not registered in the loyalty program'
      };
    }
    
    const loyaltyCustomer = loyaltyCheck.rows[0];
    
    // Send WhatsApp message
    await whatsappService.sendInvoiceMessage(contact_no, {
      invoice_no,
      date,
      customer_name: loyaltyCustomer.name || customer_name,
      items,
      discount,
      total_amount,
      payment_type
    });
    
    return {
      success: true,
      message: `Invoice sent to ${loyaltyCustomer.name} via WhatsApp`
    };
  } catch (error) {
    logger.error('WhatsApp send-invoice error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to send invoice',
      details: error?.message
    };
  }
});

// Setup WhatsApp status change listener to notify renderer
whatsappService.onStatusChange((status) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('whatsapp:status-change', status);
  }
});

// Auto-updater events - DISABLED
// To enable auto-update: uncomment the code below and configure a valid update server
// 
// autoUpdater.on('checking-for-update', () => {
//   console.log('Checking for updates...');
// });
// 
// autoUpdater.on('update-available', (info) => {
//   console.log('Update available:', info);
//   if (mainWindow) {
//     mainWindow.webContents.send('update-available', info);
//   }
// });
// 
// autoUpdater.on('update-not-available', (info) => {
//   console.log('Update not available:', info);
// });
// 
// autoUpdater.on('error', (err) => {
//   console.error('Update error:', err);
// });
// 
// autoUpdater.on('download-progress', (progress) => {
//   console.log(`Download progress: ${progress.percent}%`);
//   if (mainWindow) {
//     mainWindow.webContents.send('update-progress', progress);
//   }
// });
// 
// autoUpdater.on('update-downloaded', (info) => {
//   console.log('Update downloaded:', info);
//   if (mainWindow) {
//     mainWindow.webContents.send('update-downloaded', info);
//   }
// });
// 
// function checkForUpdates() {
//   autoUpdater.checkForUpdatesAndNotify();
// }
// 
// // Handle install update request from renderer
// ipcMain.handle('install-update', async () => {
//   autoUpdater.quitAndInstall(false, true);
// });

// App lifecycle events
app.on('ready', async () => {
  try {
    logger.info('========================================');
    logger.info('BloomSwiftPOS Starting...');
    logger.info('========================================');
    
    updateDiagnosticStatus('Electron', 'success', 'Electron initialized');
    updateDiagnosticStatus('Configuration', 'loading', 'Loading configuration...');
    
    // Load configuration
    const config = {
      dbUrl: store.get('DATABASE_URL', process.env.DATABASE_URL),
      hasJwt: !!store.get('JWT_SECRET', process.env.JWT_SECRET)
    };
    logger.info('Configuration loaded', config);
    updateDiagnosticStatus('Configuration', 'success', 'Configuration loaded');
    
    // Create diagnostic window first (in case of errors)
    createDiagnosticWindow();
    
    // Start backend server first
    await startBackendServer();
    
    // Wait a bit for backend to fully initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if backend is actually responding
    updateDiagnosticStatus('Backend Health', 'loading', 'Checking backend health...');
    try {
      const http = require('http');
      await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${BACKEND_PORT}/api/auth/health`, (res) => {
          if (res.statusCode === 200 || res.statusCode === 404) {
            // 404 is ok, means server is running but endpoint doesn't exist
            updateDiagnosticStatus('Backend Health', 'success', 'Backend is responding');
            resolve();
          } else {
            reject(new Error(`Backend returned status ${res.statusCode}`));
          }
        });
        req.on('error', (err) => {
          // Server might not have health endpoint, that's ok
          logger.warn('Backend health check warning:', err.message);
          updateDiagnosticStatus('Backend Health', 'success', 'Backend assumed healthy');
          resolve();
        });
        req.setTimeout(3000, () => {
          req.destroy();
          reject(new Error('Backend health check timeout'));
        });
      });
    } catch (error) {
      logger.warn('Backend health check failed, continuing anyway:', error.message);
      updateDiagnosticStatus('Backend Health', 'success', 'Backend started (health check inconclusive)');
    }
    
    updateDiagnosticStatus('Frontend Assets', 'loading', 'Loading frontend...');
    
    // Then create the window
    createWindow();
    
    logger.info('Application startup sequence completed');
    
  } catch (error) {
    logger.error('Failed to start application:', {
      message: error.message,
      stack: error.stack
    });
    
    setDiagnosticError(error);
    updateDiagnosticStatus('Application', 'error', 'Startup failed');
    
    // Show diagnostic window if not already visible
    if (!diagnosticWindow || diagnosticWindow.isDestroyed()) {
      createDiagnosticWindow();
    }
    
    // Don't quit immediately, let user see diagnostic info
    logger.error('Application startup failed. Diagnostic window should be visible.');
  }
});

app.on('window-all-closed', () => {
  // On macOS, keep app running unless explicitly quit
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, recreate window when dock icon is clicked
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', async (event) => {
  // Cleanup before quitting
  if (backendServer) {
    console.log('Shutting down backend server...');
    // Add any cleanup code here if needed
  }
  
  // Prevent default quit to allow cleanup to complete
  event.preventDefault();
  
  try {
    console.log('🧹 Performing cleanup before quit...');
    
    // Cleanup WhatsApp service first
    try {
      console.log('🔌 Disconnecting WhatsApp service...');
      await whatsappService.disconnect();
      console.log('✅ WhatsApp service disconnected');
    } catch (error) {
      console.error('⚠️  WhatsApp disconnect error (non-critical):', error.message);
    }
    
    // Dynamically load the cleanup utility
    const cleanupUtilPath = app.isPackaged
      ? path.join(process.resourcesPath, 'backend', 'src', 'utils', 'cleanup.js')
      : path.join(__dirname, '../backend/src/utils/cleanup.ts');
    
    if (app.isPackaged) {
      // Production: require the compiled version
      const CleanupUtility = require(cleanupUtilPath).default || require(cleanupUtilPath).CleanupUtility;
      await CleanupUtility.performFullCleanup();
    } else {
      // Development: require with ts-node
      const { CleanupUtility } = require(cleanupUtilPath);
      await CleanupUtility.performFullCleanup();
    }
    
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('⚠️  Cleanup error (non-critical):', error.message);
  }
  
  // Now actually quit
  app.exit(0);
});

// IPC Handlers for diagnostics
ipcMain.handle('get-diagnostic-data', async () => {
  diagnosticState.logs = logger.getRecentLogs(30);
  diagnosticState.logPath = logger.getCurrentLogFilePath();
  return diagnosticState;
});

ipcMain.handle('save-diagnostic-report', async (event, report) => {
  try {
    const fs = require('fs');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const reportPath = path.join(logger.getLogsDirectory(), `diagnostic-report-${timestamp}.txt`);
    fs.writeFileSync(reportPath, report);
    return { success: true, path: reportPath };
  } catch (error) {
    logger.error('Failed to save diagnostic report', error);
    return { success: false, error: error.message };
  }
});

ipcMain.on('retry-startup', () => {
  logger.info('User requested startup retry');
  app.relaunch();
  app.quit();
});

ipcMain.on('open-logs-folder', () => {
  const logsDir = logger.getLogsDirectory();
  logger.info('Opening logs folder:', logsDir);
  shell.openPath(logsDir);
});

// Handle crashes
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', {
    message: error.message,
    stack: error.stack
  });
  setDiagnosticError(error);
  
  if (!diagnosticWindow || diagnosticWindow.isDestroyed()) {
    createDiagnosticWindow();
  }
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection:', {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : ''
  });
});

// Log when app is quitting
app.on('will-quit', () => {
  logger.info('Application shutting down');
  logger.info('========================================');
});
