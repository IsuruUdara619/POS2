import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

interface WhatsAppStatus {
  isConnected: boolean;
  isInitializing: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasQRCode: boolean;
  lastConnectedAt: Date | null;
  qrGeneratedAt: Date | null;
  initializationFinishedAt: Date | null;
  authenticatedAt: Date | null;
  loadingStartedAt: Date | null;
  loadingProgress: number;
  qrCode?: string | null;
}

class WhatsAppService {
  private client: Client | null = null;
  private qrCode: string | null = null;
  private isReady: boolean = false;
  private isInitializing: boolean = false;
  private isAuthenticating: boolean = false;
  private isLoading: boolean = false;
  private lastConnectedAt: Date | null = null;
  private qrGeneratedAt: Date | null = null;
  private initializationFinishedAt: Date | null = null;
  private authenticatedAt: Date | null = null;
  private loadingStartedAt: Date | null = null;
  private loadingProgress: number = 0;
  
  private autoRestartTimeout: NodeJS.Timeout | null = null;
  private periodicConnectionCheckInterval: NodeJS.Timeout | null = null;
  
  // Event listeners for status updates
  private statusChangeListeners: ((status: WhatsAppStatus) => void)[] = [];

  constructor() {
    console.log('[WhatsApp Service] Service created');
  }

  /**
   * Subscribe to status change events
   */
  onStatusChange(callback: (status: WhatsAppStatus) => void) {
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
        console.error('[WhatsApp Service] Error in status change listener:', error);
      }
    });
  }

  /**
   * Initialize WhatsApp client with retry logic
   */
  async initialize(retryCount = 0): Promise<void> {
    const MAX_RETRIES = 3;
    
    if (this.isInitializing) {
      console.log('[WhatsApp Service] Already initializing, skipping...');
      return;
    }

    // If client exists and is initializing, destroy it first
    if (this.client) {
      console.log('[WhatsApp Service] Existing client found, destroying...');
      try {
        await this.client.destroy();
        this.client = null;
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err: any) {
        console.warn('[WhatsApp Service] Error destroying existing client:', err.message);
        this.client = null;
      }
    }

    this.isInitializing = true;
    this.emitStatusChange();

    try {
      console.log('[WhatsApp Service] 🚀 Starting initialization (attempt ' + (retryCount + 1) + '/' + MAX_RETRIES + ')...');
      
      // Use local directory for session storage
      const authPath = path.resolve(process.cwd(), '.wwebjs_auth');
      
      // Ensure directory exists
      if (!fs.existsSync(authPath)) {
        console.log('[WhatsApp Service] Creating session directory:', authPath);
        fs.mkdirSync(authPath, { recursive: true });
      }

      console.log('[WhatsApp Service] Session storage:', authPath);

      // Configure Puppeteer
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
        ]
      };

      console.log('[WhatsApp Service] 📱 Creating WhatsApp client...');
      
      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: authPath
        }),
        puppeteer: puppeteerConfig
      });

      // Setup event handlers
      this.setupEventHandlers();

      console.log('[WhatsApp Service] 🔌 Initializing client...');
      
      try {
        await this.client.initialize();
        
        this.initializationFinishedAt = new Date();
        console.log('[WhatsApp Service] ✅ Initialization started successfully');
        console.log('[WhatsApp Service] ⏳ Waiting for QR code or authentication...');
        
      } catch (initError: any) {
        console.error('[WhatsApp Service] ❌ Client initialization error:', initError);
        throw initError;
      }
      
    } catch (error) {
      console.error('[WhatsApp Service] ❌ Initialization failed:', error);
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
      
      // Retry logic could go here
    } finally {
      this.isInitializing = false;
      this.emitStatusChange();
    }
  }

  /**
   * Setup event handlers for WhatsApp client
   */
  private setupEventHandlers() {
    if (!this.client) return;

    // QR Code event
    this.client.on('qr', async (qr) => {
      console.log('[WhatsApp Service] 📷 QR Code received');
      try {
        this.qrCode = await QRCode.toDataURL(qr);
        this.qrGeneratedAt = new Date();
        console.log('[WhatsApp Service] ✅ QR Code generated at', this.qrGeneratedAt);
        this.emitStatusChange();
      } catch (err) {
        console.error('[WhatsApp Service] ❌ Error generating QR code:', err);
      }
    });

    // Ready event
    this.client.on('ready', () => {
      console.log('[WhatsApp Service] ✅✅✅ CLIENT IS READY! Connection established!');
      this.isReady = true;
      this.isAuthenticating = false;
      this.isLoading = false;
      this.qrCode = null;
      this.lastConnectedAt = new Date();
      this.loadingStartedAt = null;
      
      this.emitStatusChange();
    });

    // Authenticated event
    this.client.on('authenticated', () => {
      console.log('[WhatsApp Service] 🔐 CLIENT AUTHENTICATED! QR code scanned.');
      this.isAuthenticating = true;
      this.authenticatedAt = new Date();
      this.qrCode = null;
      this.loadingProgress = 0;
      
      this.emitStatusChange();
    });

    // Loading screen event
    this.client.on('loading_screen', (percent, message) => {
      const percentNum = typeof percent === 'string' ? parseInt(percent, 10) : percent;
      console.log('[WhatsApp Service] 📊 Loading:', percentNum + '%', message);
      this.isLoading = true;
      this.loadingProgress = percentNum;
      
      if (!this.loadingStartedAt) {
        this.loadingStartedAt = new Date();
      }
      
      this.emitStatusChange();
    });

    // Authentication failure event
    this.client.on('auth_failure', (msg) => {
      console.error('[WhatsApp Service] ❌ Authentication failure:', msg);
      this.isReady = false;
      this.isAuthenticating = false;
      this.isLoading = false;
      this.qrCode = null;
      
      this.emitStatusChange();
    });

    // Disconnected event
    this.client.on('disconnected', (reason) => {
      console.log('[WhatsApp Service] ⚠️ Client disconnected:', reason);
      this.isReady = false;
      this.isAuthenticating = false;
      this.isLoading = false;
      this.qrCode = null;
      
      this.emitStatusChange();
    });
  }

  /**
   * Get current status
   */
  getStatus(): WhatsAppStatus {
    return {
      isConnected: this.isReady,
      isInitializing: this.isInitializing,
      isAuthenticated: this.isAuthenticating,
      isLoading: this.isLoading,
      hasQRCode: !!this.qrCode,
      qrCode: this.qrCode,
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
   * Reconnect WhatsApp client
   */
  async reconnect(): Promise<void> {
    console.log('[WhatsApp Service] 🔄 Reconnecting...');
    await this.disconnect();
    // Wait a bit before initializing again
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.initialize();
  }

  /**
   * Disconnect WhatsApp client
   */
  async disconnect(): Promise<void> {
    console.log('[WhatsApp Service] 🔌 Disconnecting...');
    
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
        console.log('[WhatsApp Service] ✅ Client destroyed');
        this.emitStatusChange();
      } catch (error) {
        console.error('[WhatsApp Service] ❌ Disconnect error:', error);
      }
    }
  }

  /**
   * Send invoice message to customer
   */
  async sendInvoiceMessage(phoneNumber: string, invoiceData: any): Promise<boolean> {
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
      // Note: isRegisteredUser might be flaky in some versions of whatsapp-web.js
      try {
          const numberExists = await this.client.isRegisteredUser(chatId);
          if (!numberExists) {
            throw new Error('This phone number is not registered on WhatsApp');
          }
      } catch (e) {
          console.warn('[WhatsApp Service] Could not verify if number exists, trying to send anyway...', e);
      }

      // Format the invoice message
      const message = this.formatInvoiceMessage(invoiceData);

      // Send the message
      await this.client.sendMessage(chatId, message);
      console.log(`[WhatsApp Service] ✅ Invoice sent to ${formattedNumber}`);
      
      return true;
    } catch (error: any) {
      console.error('[WhatsApp Service] ❌ Send error:', error);
      throw new Error(error?.message || 'Failed to send WhatsApp message');
    }
  }

  /**
   * Format invoice message
   */
  private formatInvoiceMessage(data: any): string {
    const formattedDate = new Date(data.date).toLocaleDateString('en-GB');
    
    let message = `🛠️ *Weerasingha Hardware Invoice*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `📋 Invoice: ${data.invoice_no}\n`;
    message += `📅 Date: ${formattedDate}\n`;
    
    // Add more details if available in data
    if (data.items && Array.isArray(data.items)) {
        message += `\n🛒 Items:\n`;
        data.items.forEach((item: any) => {
            message += `- ${item.name} (${item.quantity} x ${item.price})\n`;
        });
    }

    if (data.total) {
        message += `\n💰 Total: Rs. ${data.total}\n`;
    }

    message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    message += `Thank you for your business!\n`;
    
    return message;
  }
}

// Export singleton instance
const whatsappService = new WhatsAppService();
export default whatsappService;
