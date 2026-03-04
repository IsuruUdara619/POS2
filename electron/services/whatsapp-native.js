const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

/**
 * Native WhatsApp Service for Electron
 * Uses Electron's built-in Chromium instead of downloading separate browser
 */
class WhatsAppNativeService {
  constructor() {
    this.client = null;
    this.qrCode = null;
    this.isReady = false;
    this.isInitializing = false;
    this.isAuthenticating = false;
    this.isLoading = false;
    this.lastConnectedAt = null;
    this.qrGeneratedAt = null;
    this.initializationFinishedAt = null;
    this.authenticatedAt = null;
    this.loadingStartedAt = null;
    this.autoRestartTimeout = null;
    this.loadingProgress = 0;
    this.periodicConnectionCheckInterval = null;
    this.browserProcess = null; // Track browser process
    
    // Event listeners for status updates
    this.statusChangeListeners = [];
    
    console.log('[WhatsApp Native] Service created');
  }

  /**
   * Subscribe to status change events
   */
  onStatusChange(callback) {
    this.statusChangeListeners.push(callback);
  }

  /**
   * Emit status change to all listeners
   */
  emitStatusChange() {
    const status = this.getStatus();
    this.statusChangeListeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('[WhatsApp Native] Error in status change listener:', error);
      }
    });
  }

  /**
   * Kill any orphaned Chrome/Chromium processes related to WhatsApp
   */
  async killOrphanedBrowsers() {
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    try {
      console.log('[WhatsApp Native] 🔍 Checking for orphaned browser processes and lock files...');
      
      // Kill any Chrome/Chromium processes with our session path
      const userDataPath = app.getPath('userData');
      const sessionPath = path.join(userDataPath, 'whatsapp-session');
      
      try {
        // Try to find and kill processes using our session directory
        await execPromise(`pkill -f "chrome.*${sessionPath}" || true`);
        await execPromise(`pkill -f "chromium.*${sessionPath}" || true`);
        console.log('[WhatsApp Native] ✅ Cleaned up orphaned browser processes');
      } catch (error) {
        // Ignore errors - processes might not exist
        console.log('[WhatsApp Native] ℹ️  No orphaned processes found');
      }
      
      // Wait a moment for processes to fully terminate
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remove Chrome lock files that prevent new browser instances
      const sessionDir = path.join(sessionPath, 'session');
      if (fs.existsSync(sessionDir)) {
        try {
          const lockFiles = ['SingletonLock', 'SingletonSocket', 'SingletonCookie'];
          for (const lockFile of lockFiles) {
            const lockPath = path.join(sessionDir, lockFile);
            if (fs.existsSync(lockPath)) {
              fs.unlinkSync(lockPath);
              console.log(`[WhatsApp Native] 🗑️  Removed lock file: ${lockFile}`);
            }
          }
          console.log('[WhatsApp Native] ✅ Cleaned up Chrome lock files');
        } catch (error) {
          console.warn('[WhatsApp Native] ⚠️  Error removing lock files:', error.message);
        }
      }
      
    } catch (error) {
      console.warn('[WhatsApp Native] ⚠️  Error checking for orphaned browsers:', error.message);
    }
  }

  /**
   * Initialize WhatsApp client with retry logic
   */
  async initialize(retryCount = 0) {
    const MAX_RETRIES = 3;
    
    if (this.isInitializing) {
      console.log('[WhatsApp Native] Already initializing, skipping...');
      return;
    }

    // If client exists and is initializing, destroy it first
    if (this.client) {
      console.log('[WhatsApp Native] Existing client found, destroying...');
      try {
        await this.client.destroy();
        this.client = null;
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.warn('[WhatsApp Native] Error destroying existing client:', err.message);
        this.client = null;
      }
    }

    this.isInitializing = true;
    this.emitStatusChange();

    try {
      console.log('[WhatsApp Native] 🚀 Starting initialization (attempt ' + (retryCount + 1) + '/' + MAX_RETRIES + ')...');
      
      // First, clean up any orphaned browser processes
      await this.killOrphanedBrowsers();
      
      // Use Electron's userData directory for session storage
      const userDataPath = app.getPath('userData');
      const authPath = path.join(userDataPath, 'whatsapp-session');
      
      // Ensure directory exists
      if (!fs.existsSync(authPath)) {
        console.log('[WhatsApp Native] Creating session directory:', authPath);
        fs.mkdirSync(authPath, { recursive: true });
      }

      console.log('[WhatsApp Native] Session storage:', authPath);

      // Configure Puppeteer to work with Electron
      const puppeteerConfig = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--no-zygote',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-blink-features=AutomationControlled',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-background-timer-throttling',
          '--disable-sync',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-default-apps',
          '--disable-popup-blocking',
          '--disable-software-rasterizer',
          '--disable-canvas-aa',
          '--disable-2d-canvas-clip-aa',
        ]
      };

      // Use Puppeteer's bundled Chromium for reliability
      // System Chromium (especially snap) can have sandboxing conflicts
      console.log('[WhatsApp Native] Using Puppeteer bundled Chromium for maximum compatibility');

      console.log('[WhatsApp Native] 📱 Creating WhatsApp client...');
      
      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: authPath
        }),
        puppeteer: puppeteerConfig
      });

      // Setup event handlers
      this.setupEventHandlers();

      console.log('[WhatsApp Native] 🔌 Initializing client...');
      
      try {
        await this.client.initialize();
        
        this.initializationFinishedAt = new Date();
        console.log('[WhatsApp Native] ✅ Initialization started successfully');
        console.log('[WhatsApp Native] ⏳ Waiting for QR code or authentication...');
        
      } catch (initError) {
        // Check if it's the "browser already running" error
        if (initError.message && initError.message.includes('browser is already running')) {
          console.error('[WhatsApp Native] ⚠️ Browser already running error detected!');
          
          // Destroy the client completely
          if (this.client) {
            console.log('[WhatsApp Native] 🗑️ Force destroying client and browser...');
            try {
              await this.client.destroy();
            } catch (destroyErr) {
              console.warn('[WhatsApp Native] Error during destroy:', destroyErr.message);
            }
            this.client = null;
          }
          
          // NUCLEAR OPTION: Delete entire session directory
          const userDataPath = app.getPath('userData');
          const authPath = path.join(userDataPath, 'whatsapp-session');
          
          console.log('[WhatsApp Native] 💣 Nuking session directory...');
          try {
            if (fs.existsSync(authPath)) {
              fs.rmSync(authPath, { recursive: true, force: true });
              console.log('[WhatsApp Native] ✅ Session directory deleted');
            }
          } catch (rmErr) {
            console.warn('[WhatsApp Native] ⚠️ Error deleting session:', rmErr.message);
          }
          
          // Clean up more aggressively
          await this.killOrphanedBrowsers();
          
          // If we haven't exceeded retry limit, try again
          if (retryCount < MAX_RETRIES - 1) {
            const waitTime = Math.pow(2, retryCount) * 3000; // Exponential backoff: 3s, 6s, 12s
            console.log(`[WhatsApp Native] ⏳ Waiting ${waitTime/1000}s before retry...`);
            this.isInitializing = false;
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return await this.initialize(retryCount + 1);
          } else {
            console.error('[WhatsApp Native] ❌ Max retries exceeded');
            throw new Error('Failed to initialize WhatsApp after ' + MAX_RETRIES + ' attempts');
          }
        } else {
          // Different error, throw it
          throw initError;
        }
      }
      
    } catch (error) {
      console.error('[WhatsApp Native] ❌ Initialization failed:', error);
      this.isInitializing = false;
      
      // Clean up
      if (this.client) {
        try {
          await this.client.destroy();
        } catch (err) {
          // Ignore cleanup errors
        }
        this.client = null;
      }
      
      this.emitStatusChange();
      throw error;
    } finally {
      this.isInitializing = false;
      this.emitStatusChange();
    }
  }

  /**
   * Setup event handlers for WhatsApp client
   */
  setupEventHandlers() {
    if (!this.client) return;

    // QR Code event
    this.client.on('qr', async (qr) => {
      console.log('[WhatsApp Native] 📷 QR Code received');
      try {
        this.qrCode = await QRCode.toDataURL(qr);
        this.qrGeneratedAt = new Date();
        console.log('[WhatsApp Native] ✅ QR Code generated at', this.qrGeneratedAt);
        this.emitStatusChange();
      } catch (err) {
        console.error('[WhatsApp Native] ❌ Error generating QR code:', err);
      }
    });

    // Ready event
    this.client.on('ready', () => {
      console.log('[WhatsApp Native] ✅✅✅ CLIENT IS READY! Connection established!');
      this.isReady = true;
      this.isAuthenticating = false;
      this.isLoading = false;
      this.qrCode = null;
      this.lastConnectedAt = new Date();
      this.loadingStartedAt = null;
      
      // Clear timeouts
      if (this.autoRestartTimeout) {
        clearTimeout(this.autoRestartTimeout);
        this.autoRestartTimeout = null;
      }
      if (this.periodicConnectionCheckInterval) {
        clearInterval(this.periodicConnectionCheckInterval);
        this.periodicConnectionCheckInterval = null;
      }
      
      this.emitStatusChange();
    });

    // Authenticated event
    this.client.on('authenticated', () => {
      console.log('[WhatsApp Native] 🔐 CLIENT AUTHENTICATED! QR code scanned.');
      this.isAuthenticating = true;
      this.authenticatedAt = new Date();
      this.qrCode = null;
      this.loadingProgress = 0;
      
      console.log('[WhatsApp Native] ⏳ Waiting for ready event...');
      this.emitStatusChange();
      
      // Start periodic connection state checking
      console.log('[WhatsApp Native] 🔄 Starting periodic connection checks...');
      let checkCount = 0;
      
      if (this.periodicConnectionCheckInterval) {
        clearInterval(this.periodicConnectionCheckInterval);
      }
      
      this.periodicConnectionCheckInterval = setInterval(async () => {
        if (this.isReady) {
          clearInterval(this.periodicConnectionCheckInterval);
          this.periodicConnectionCheckInterval = null;
          return;
        }
        
        checkCount++;
        console.log(`[WhatsApp Native] 🔍 Check #${checkCount} - Verifying state...`);
        
        try {
          if (this.client) {
            const state = await this.client.getState();
            console.log(`[WhatsApp Native] State: ${state}`);
            
            if (state === 'CONNECTED') {
              console.log('[WhatsApp Native] ✅ Manually triggering ready state');
              this.isReady = true;
              this.isAuthenticating = false;
              this.isLoading = false;
              this.lastConnectedAt = new Date();
              this.loadingStartedAt = null;
              
              if (this.periodicConnectionCheckInterval) {
                clearInterval(this.periodicConnectionCheckInterval);
                this.periodicConnectionCheckInterval = null;
              }
              if (this.autoRestartTimeout) {
                clearTimeout(this.autoRestartTimeout);
                this.autoRestartTimeout = null;
              }
              
              this.emitStatusChange();
            }
          }
        } catch (error) {
          console.log(`[WhatsApp Native] ⚠️ Check #${checkCount} failed:`, error.message);
        }
      }, 10000); // Check every 10 seconds
      
      // Auto-restart if stuck (3 minutes timeout)
      if (this.autoRestartTimeout) {
        clearTimeout(this.autoRestartTimeout);
      }
      this.autoRestartTimeout = setTimeout(() => {
        if (this.isAuthenticating && !this.isReady) {
          console.log('[WhatsApp Native] ⚠️ Stuck in authenticated state. Auto-restarting...');
          
          if (this.periodicConnectionCheckInterval) {
            clearInterval(this.periodicConnectionCheckInterval);
            this.periodicConnectionCheckInterval = null;
          }
          
          this.restart().catch(err => {
            console.error('[WhatsApp Native] Auto-restart failed:', err);
          });
        }
      }, 180000); // 3 minutes
    });

    // Loading screen event
    this.client.on('loading_screen', (percent, message) => {
      const percentNum = typeof percent === 'string' ? parseInt(percent, 10) : percent;
      console.log('[WhatsApp Native] 📊 Loading:', percentNum + '%', message);
      this.isLoading = true;
      this.loadingProgress = percentNum;
      
      if (!this.loadingStartedAt) {
        this.loadingStartedAt = new Date();
      }
      
      this.emitStatusChange();
    });

    // Authentication failure event
    this.client.on('auth_failure', (msg) => {
      console.error('[WhatsApp Native] ❌ Authentication failure:', msg);
      this.isReady = false;
      this.isAuthenticating = false;
      this.isLoading = false;
      this.qrCode = null;
      
      if (this.autoRestartTimeout) {
        clearTimeout(this.autoRestartTimeout);
        this.autoRestartTimeout = null;
      }
      
      this.emitStatusChange();
    });

    // Disconnected event
    this.client.on('disconnected', (reason) => {
      console.log('[WhatsApp Native] ⚠️ Client disconnected:', reason);
      this.isReady = false;
      this.isAuthenticating = false;
      this.isLoading = false;
      this.qrCode = null;
      
      if (this.autoRestartTimeout) {
        clearTimeout(this.autoRestartTimeout);
        this.autoRestartTimeout = null;
      }
      
      this.emitStatusChange();
    });

    // Remote session saved event
    this.client.on('remote_session_saved', () => {
      console.log('[WhatsApp Native] 💾 Remote session saved');
    });
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isConnected: this.isReady,
      isInitializing: this.isInitializing,
      isAuthenticated: this.isAuthenticating,
      isLoading: this.isLoading,
      hasQRCode: !!this.qrCode,
      lastConnectedAt: this.lastConnectedAt,
      qrGeneratedAt: this.qrGeneratedAt,
      initializationFinishedAt: this.initializationFinishedAt,
      authenticatedAt: this.authenticatedAt,
      loadingStartedAt: this.loadingStartedAt,
      loadingProgress: this.loadingProgress
    };
  }

  /**
   * Get QR code
   */
  getQRCode() {
    return this.qrCode;
  }

  /**
   * Restart WhatsApp client
   */
  async restart() {
    console.log('[WhatsApp Native] 🔄 Restarting...');
    await this.disconnect();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.initialize();
  }

  /**
   * Clear session data
   */
  async clearSession() {
    const userDataPath = app.getPath('userData');
    const authPath = path.join(userDataPath, 'whatsapp-session');
    
    try {
      if (fs.existsSync(authPath)) {
        console.log('[WhatsApp Native] 🗑️ Clearing session data...');
        fs.rmSync(authPath, { recursive: true, force: true });
        console.log('[WhatsApp Native] ✅ Session cleared');
      }
    } catch (error) {
      console.error('[WhatsApp Native] ❌ Error clearing session:', error);
      throw error;
    }
  }

  /**
   * Reconnect (disconnect + clear session + initialize)
   */
  async reconnect() {
    console.log('[WhatsApp Native] 🔄 Reconnecting...');
    try {
      await this.disconnect();
      await this.clearSession();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await this.initialize();
      console.log('[WhatsApp Native] Reconnection initiated');
    } catch (error) {
      console.error('[WhatsApp Native] ❌ Reconnection error:', error);
      throw error;
    }
  }

  /**
   * Disconnect WhatsApp client
   */
  async disconnect() {
    console.log('[WhatsApp Native] 🔌 Disconnecting...');
    
    // Clear all timeouts and intervals
    if (this.autoRestartTimeout) {
      clearTimeout(this.autoRestartTimeout);
      this.autoRestartTimeout = null;
    }
    if (this.periodicConnectionCheckInterval) {
      clearInterval(this.periodicConnectionCheckInterval);
      this.periodicConnectionCheckInterval = null;
    }
    
    if (this.client) {
      try {
        await this.client.destroy();
        this.client = null;
        this.isReady = false;
        this.isAuthenticating = false;
        this.isLoading = false;
        this.qrCode = null;
        this.lastConnectedAt = null;
        this.authenticatedAt = null;
        this.loadingStartedAt = null;
        console.log('[WhatsApp Native] ✅ Client destroyed');
        this.emitStatusChange();
      } catch (error) {
        console.error('[WhatsApp Native] ❌ Disconnect error:', error);
        // Don't throw - continue with cleanup
      }
    }
    
    // Force kill any remaining browser processes
    await this.killOrphanedBrowsers();
    console.log('[WhatsApp Native] ✅ Disconnected successfully');
  }

  /**
   * Send invoice message to customer
   */
  async sendInvoiceMessage(phoneNumber, invoiceData) {
    if (!this.isReady || !this.client) {
      throw new Error('WhatsApp client is not ready. Please connect first.');
    }

    try {
      // Format phone number (remove non-digits)
      let formattedNumber = phoneNumber.replace(/\D/g, '');
      
      // Add country code if not present (Sri Lanka +94)
      if (!formattedNumber.startsWith('94')) {
        if (formattedNumber.startsWith('0')) {
          formattedNumber = formattedNumber.substring(1);
        }
        formattedNumber = '94' + formattedNumber;
      }

      // WhatsApp format: number@c.us
      const chatId = `${formattedNumber}@c.us`;

      // Check if number exists on WhatsApp
      const numberExists = await this.client.isRegisteredUser(chatId);
      if (!numberExists) {
        throw new Error('This phone number is not registered on WhatsApp');
      }

      // Format the invoice message
      const message = this.formatInvoiceMessage(invoiceData);

      // Send the message
      await this.client.sendMessage(chatId, message);
      console.log(`[WhatsApp Native] ✅ Invoice sent to ${formattedNumber}`);
      
      return true;
    } catch (error) {
      console.error('[WhatsApp Native] ❌ Send error:', error);
      throw new Error(error?.message || 'Failed to send WhatsApp message');
    }
  }

  /**
   * Format invoice message
   */
  formatInvoiceMessage(data) {
    const formattedDate = new Date(data.date).toLocaleDateString('en-GB');
    
    let message = `🛠️ *Demo POS System Invoice*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `📋 Invoice: ${data.invoice_no}\n`;
    message += `📅 Date: ${formattedDate}\n`;
    message += `👤 Customer: ${data.customer_name}\n\n`;
    message += `🛍️ *Items:*\n`;

    let subtotal = 0;
    data.items.forEach(item => {
      const itemTotal = item.qty * item.selling_price;
      subtotal += itemTotal;
      message += `• ${item.product_name}\n`;
      message += `  ${item.qty} × Rs. ${item.selling_price.toFixed(2)}\n`;
      message += `  Total: Rs. ${itemTotal.toFixed(2)}\n`;
    });

    message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    
    if (data.discount && data.discount > 0) {
      message += `Subtotal: Rs. ${subtotal.toFixed(2)}\n`;
      const discountAmount = subtotal * (data.discount / 100);
      message += `Discount (${data.discount}%): -Rs. ${discountAmount.toFixed(2)}\n`;
      message += `━━━━━━━━━━━━━━━━━━━━\n`;
    }
    
    message += `💰 *TOTAL: Rs. ${data.total_amount.toFixed(2)}*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    if (data.payment_type) {
      message += `💳 Payment: ${data.payment_type}\n\n`;
    }
    
    message += `Thank you for choosing Demo POS System! 🙏\n`;
    message += `See you again soon! ✨`;

    return message;
  }
}

// Export singleton instance
module.exports = new WhatsAppNativeService();
