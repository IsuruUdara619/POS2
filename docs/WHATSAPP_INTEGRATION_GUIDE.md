# WhatsApp Integration Guide for POS Applications

## Overview

This guide provides step-by-step instructions to recreate the WhatsApp integration from Heaven Bakers POS system. The integration allows you to send invoice messages to customers via WhatsApp automatically after completing a sale.

### Features
- 📱 Send formatted invoices to customers via WhatsApp
- 🔒 Completely free - uses your WhatsApp Web session
- 🔐 Secure authentication with QR code
- 💾 Session persistence (stays connected after restart)
- 🖥️ Works on Windows, Linux, and Docker environments
- ✅ Automatic loyalty customer detection
- 📊 Real-time connection status monitoring

---

## Table of Contents
1. [Backend Setup](#backend-setup)
2. [Frontend Setup](#frontend-setup)
3. [Testing the Integration](#testing-the-integration)
4. [Troubleshooting](#troubleshooting)

---

## Backend Setup

### Step 1: Install Required Dependencies

Add the following packages to your backend `package.json`:

```json
{
  "dependencies": {
    "whatsapp-web.js": "^1.34.2",
    "qrcode": "^1.5.4"
  },
  "devDependencies": {
    "@types/qrcode": "^1.5.6"
  }
}
```

Install them:
```bash
npm install whatsapp-web.js qrcode
npm install --save-dev @types/qrcode
```

### Step 2: Create WhatsApp Service

Create a new file `backend/src/services/whatsapp.ts`:

```typescript
import { Client, LocalAuth } from 'whatsapp-web.js';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';

class WhatsAppService {
  private client: Client | null = null;
  private qrCode: string | null = null;
  private isReady: boolean = false;
  private isInitializing: boolean = false;
  private lastConnectedAt: Date | null = null;
  private qrGeneratedAt: Date | null = null;

  constructor() {
    // Auto-initialize on service creation
    this.initialize();
  }

  async initialize() {
    if (this.isInitializing || this.client) {
      return;
    }

    this.isInitializing = true;

    try {
      console.log('Initializing WhatsApp client...');
      
      const authPath = path.join(__dirname, '../../data/.wwebjs_auth');
      
      // Determine platform-specific configuration
      const isWindows = process.platform === 'win32';
      const puppeteerConfig: any = {
        headless: true,
        args: [
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--disable-gpu'
        ]
      };

      // Only add Linux-specific args if not on Windows
      if (!isWindows) {
        puppeteerConfig.args.push(
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--no-zygote'
        );
        // Set executablePath for Linux/Docker
        puppeteerConfig.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser';
      }
      // On Windows, let Puppeteer use its bundled Chrome (don't set executablePath)

      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: authPath
        }),
        puppeteer: puppeteerConfig
      });

      // QR Code event
      this.client.on('qr', async (qr) => {
        console.log('QR Code received');
        try {
          this.qrCode = await QRCode.toDataURL(qr);
          this.qrGeneratedAt = new Date();
          console.log('QR Code generated successfully at', this.qrGeneratedAt);
        } catch (err) {
          console.error('Error generating QR code:', err);
        }
      });

      // Ready event
      this.client.on('ready', () => {
        console.log('WhatsApp client is ready!');
        this.isReady = true;
        this.qrCode = null;
        this.lastConnectedAt = new Date();
      });

      // Authenticated event
      this.client.on('authenticated', () => {
        console.log('WhatsApp client authenticated');
        this.qrCode = null;
      });

      // Authentication failure event
      this.client.on('auth_failure', (msg) => {
        console.error('WhatsApp authentication failure:', msg);
        this.isReady = false;
        this.qrCode = null;
      });

      // Disconnected event
      this.client.on('disconnected', (reason) => {
        console.log('WhatsApp client disconnected:', reason);
        this.isReady = false;
        this.qrCode = null;
      });

      await this.client.initialize();
      console.log('WhatsApp client initialization started');
    } catch (error) {
      console.error('Error initializing WhatsApp client:', error);
      this.isInitializing = false;
      this.client = null;
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  getStatus() {
    return {
      isConnected: this.isReady,
      isInitializing: this.isInitializing,
      hasQRCode: !!this.qrCode,
      lastConnectedAt: this.lastConnectedAt,
      qrGeneratedAt: this.qrGeneratedAt
    };
  }

  getQRCode(): string | null {
    // Check if QR code is expired (older than 30 seconds)
    if (this.qrCode && this.qrGeneratedAt) {
      const ageInSeconds = (Date.now() - this.qrGeneratedAt.getTime()) / 1000;
      if (ageInSeconds > 30) {
        console.log('QR code expired, will regenerate on next scan');
        return null;
      }
    }
    return this.qrCode;
  }

  async clearSession() {
    const authPath = path.join(__dirname, '../../data/.wwebjs_auth');
    try {
      if (fs.existsSync(authPath)) {
        console.log('Clearing WhatsApp session data...');
        fs.rmSync(authPath, { recursive: true, force: true });
        console.log('Session data cleared successfully');
      }
    } catch (error) {
      console.error('Error clearing session data:', error);
      throw error;
    }
  }

  async reconnect() {
    console.log('Attempting to reconnect WhatsApp...');
    try {
      // Disconnect existing client
      await this.disconnect();
      
      // Clear session data to force fresh QR code
      await this.clearSession();
      
      // Wait a bit before reinitializing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reinitialize
      await this.initialize();
      
      console.log('Reconnection initiated, waiting for QR code...');
    } catch (error) {
      console.error('Error during reconnection:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      try {
        await this.client.destroy();
        this.client = null;
        this.isReady = false;
        this.qrCode = null;
        this.lastConnectedAt = null;
        console.log('WhatsApp client disconnected successfully');
      } catch (error) {
        console.error('Error disconnecting WhatsApp client:', error);
        throw error;
      }
    }
  }

  async sendInvoiceMessage(phoneNumber: string, invoiceData: {
    invoice_no: string;
    date: string;
    customer_name: string;
    items: Array<{ product_name: string; qty: number; selling_price: number }>;
    discount?: number;
    total_amount: number;
    payment_type?: string;
  }): Promise<boolean> {
    if (!this.isReady || !this.client) {
      throw new Error('WhatsApp client is not ready. Please connect first.');
    }

    try {
      // Format phone number (remove any non-digit characters)
      let formattedNumber = phoneNumber.replace(/\D/g, '');
      
      // Add country code if not present (assuming Sri Lanka +94)
      // IMPORTANT: Adjust this for your country code
      if (!formattedNumber.startsWith('94')) {
        // Remove leading 0 if present
        if (formattedNumber.startsWith('0')) {
          formattedNumber = formattedNumber.substring(1);
        }
        formattedNumber = '94' + formattedNumber;
      }

      // WhatsApp number format: number@c.us
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
      console.log(`Invoice sent to ${formattedNumber}`);
      
      return true;
    } catch (error: any) {
      console.error('Error sending WhatsApp message:', error);
      throw new Error(error?.message || 'Failed to send WhatsApp message');
    }
  }

  private formatInvoiceMessage(data: {
    invoice_no: string;
    date: string;
    customer_name: string;
    items: Array<{ product_name: string; qty: number; selling_price: number }>;
    discount?: number;
    total_amount: number;
    payment_type?: string;
  }): string {
    const formattedDate = new Date(data.date).toLocaleDateString('en-GB');
    
    // Customize this message format to match your business branding
    let message = `🧁 *Heaven Bakers Invoice*\n`;
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
    
    message += `Thank you for choosing Heaven Bakers! 🙏\n`;
    message += `See you again soon! ✨`;

    return message;
  }
}

// Create singleton instance
const whatsappService = new WhatsAppService();

export default whatsappService;
```

**Important Notes:**
- The `authPath` stores WhatsApp session data in `backend/data/.wwebjs_auth`
- Create the `backend/data` directory if it doesn't exist
- Platform-specific Puppeteer configuration handles Windows vs Linux/Docker
- Adjust country code logic in `sendInvoiceMessage` for your region

### Step 3: Create WhatsApp Routes

Create a new file `backend/src/routes/whatsapp.ts`:

```typescript
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import whatsappService from '../services/whatsapp';
import { pool } from '../db';

const router = Router();

function requireAuth(req: any, res: any) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).send('Server misconfigured');
    return false;
  }
  if (!token) {
    res.status(401).send('Unauthorized');
    return false;
  }
  try {
    jwt.verify(token, secret);
    return true;
  } catch {
    res.status(401).send('Unauthorized');
    return false;
  }
}

// Get WhatsApp connection status
router.get('/status', async (req, res) => {
  if (!requireAuth(req, res)) return;

  try {
    const status = whatsappService.getStatus();
    res.json(status);
  } catch (error: any) {
    res.status(500).send(error?.message || 'Failed to get status');
  }
});

// Get QR code for WhatsApp connection
router.get('/qr', async (req, res) => {
  if (!requireAuth(req, res)) return;

  try {
    const qrCode = whatsappService.getQRCode();
    
    if (!qrCode) {
      const status = whatsappService.getStatus();
      
      if (status.isConnected) {
        return res.status(400).json({
          error: 'Already connected',
          message: 'WhatsApp is already connected. No QR code needed.'
        });
      }
      
      if (!status.isInitializing) {
        // Try to re-initialize if not initializing
        await whatsappService.initialize();
      }
      
      return res.status(202).json({
        error: 'QR code not ready',
        message: 'QR code is being generated. Please try again in a moment.',
        isInitializing: status.isInitializing
      });
    }

    res.json({ qrCode });
  } catch (error: any) {
    res.status(500).send(error?.message || 'Failed to get QR code');
  }
});

// Disconnect WhatsApp
router.post('/disconnect', async (req, res) => {
  if (!requireAuth(req, res)) return;

  try {
    await whatsappService.disconnect();
    res.json({ success: true, message: 'WhatsApp disconnected successfully' });
  } catch (error: any) {
    res.status(500).send(error?.message || 'Failed to disconnect');
  }
});

// Reconnect WhatsApp (clears session and forces new QR)
router.post('/reconnect', async (req, res) => {
  if (!requireAuth(req, res)) return;

  try {
    await whatsappService.reconnect();
    res.json({ success: true, message: 'WhatsApp reconnecting... Please scan the new QR code.' });
  } catch (error: any) {
    res.status(500).send(error?.message || 'Failed to reconnect');
  }
});

// Send invoice to loyalty customer
router.post('/send-invoice', async (req, res) => {
  if (!requireAuth(req, res)) return;

  const {
    contact_no,
    invoice_no,
    date,
    customer_name,
    items,
    discount,
    total_amount,
    payment_type
  } = req.body as {
    contact_no: string;
    invoice_no: string;
    date: string;
    customer_name: string;
    items: Array<{ product_name: string; qty: number; selling_price: number }>;
    discount?: number;
    total_amount: number;
    payment_type?: string;
  };

  if (!contact_no) {
    return res.status(400).send('Missing contact number');
  }

  if (!invoice_no || !date || !customer_name || !items || !total_amount) {
    return res.status(400).send('Missing required invoice data');
  }

  try {
    // Check if contact number belongs to a loyalty customer
    // ADJUST THIS QUERY TO MATCH YOUR DATABASE SCHEMA
    const loyaltyCheck = await pool.query(
      'SELECT loyalty_customer_id, name FROM loyalty_customers WHERE mobile_no = $1',
      [contact_no]
    );

    if (loyaltyCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Not a loyalty customer',
        message: 'This customer is not registered in the loyalty program'
      });
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

    res.json({
      success: true,
      message: `Invoice sent to ${loyaltyCustomer.name} via WhatsApp`
    });
  } catch (error: any) {
    console.error('Error sending invoice:', error);
    res.status(500).json({
      error: error?.message || 'Failed to send invoice',
      details: error?.message
    });
  }
});

export default router;
```

### Step 4: Register Routes in Main Server File

In your main server file (e.g., `backend/index.ts`), add:

```typescript
import whatsappRouter from './src/routes/whatsapp';

// ... other imports and setup ...

app.use('/whatsapp', whatsappRouter);
```

### Step 5: Create Data Directory

Create the directory for WhatsApp session storage:

```bash
mkdir -p backend/data
```

Add to your `.gitignore`:
```
backend/data/.wwebjs_auth/
```

---

## Frontend Setup

### Step 1: Add WhatsApp Connection UI to Settings Page

In your Settings page component, add this WhatsApp configuration section:

```typescript
import { useState, useEffect } from 'react';
import { get, post } from '../services/api'; // Your API service

function Settings() {
  const [whatsappStatus, setWhatsappStatus] = useState<any>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCode, setQRCode] = useState('');

  useEffect(() => {
    loadWhatsAppStatus();
    
    // Auto-refresh WhatsApp status every 10 seconds
    const interval = setInterval(loadWhatsAppStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  async function loadWhatsAppStatus() {
    try {
      const r = await get('/whatsapp/status');
      setWhatsappStatus(r);
    } catch (e) {
      console.error('Failed to load WhatsApp status:', e);
    }
  }

  async function handleConnectWhatsApp() {
    setShowQRModal(true);
    
    // First reconnect to get a fresh QR code
    await post('/whatsapp/reconnect', {});
    
    // Wait a moment for the backend to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to get QR code
    const r = await get('/whatsapp/qr');
    if (r.qrCode) {
      setQRCode(r.qrCode);
      
      // Poll for connection status
      const checkConnection = setInterval(async () => {
        try {
          const status = await get('/whatsapp/status');
          if (status.isConnected) {
            setWhatsappStatus(status);
            setShowQRModal(false);
            clearInterval(checkConnection);
            alert('✅ WhatsApp connected successfully!');
          }
        } catch {}
      }, 2000);
      
      // Stop polling after 60 seconds
      setTimeout(() => clearInterval(checkConnection), 60000);
    } else {
      // Retry after a moment
      setTimeout(async () => {
        try {
          const retry = await get('/whatsapp/qr');
          if (retry.qrCode) {
            setQRCode(retry.qrCode);
          }
        } catch {}
      }, 3000);
    }
  }

  async function handleDisconnectWhatsApp() {
    if (!confirm('Are you sure you want to disconnect WhatsApp?')) return;
    
    try {
      await post('/whatsapp/disconnect', {});
      setWhatsappStatus(null);
      alert('WhatsApp disconnected successfully');
    } catch (e: any) {
      alert('Failed to disconnect: ' + (e?.message || 'Unknown error'));
    }
  }

  return (
    <div>
      {/* Your other settings content */}
      
      {/* WhatsApp Configuration Section */}
      <div style={{ marginTop: 48 }}>
        <h2>📱 WhatsApp Invoice Messenger</h2>
        
        <div style={{ background: '#fff', borderRadius: 12, padding: 32 }}>
          {whatsappStatus?.isConnected ? (
            // Connected State
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  background: '#4caf50',
                  boxShadow: '0 0 8px #4caf50'
                }} />
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>Connected</div>
                  <div style={{ fontSize: 14, color: '#666' }}>
                    {whatsappStatus.lastConnectedAt ?
                      `Last synced: ${new Date(whatsappStatus.lastConnectedAt).toLocaleString()}` :
                      'Active'}
                  </div>
                </div>
              </div>
              
              <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 24 }}>
                When printing receipts at checkout, you can automatically send invoice details to your loyalty customers via WhatsApp.
              </div>
              
              <button onClick={handleDisconnectWhatsApp}>
                🔌 Disconnect WhatsApp
              </button>
            </div>
          ) : (
            // Not Connected State
            <div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>Not Connected</div>
                <div style={{ fontSize: 14, color: '#666' }}>
                  Connect WhatsApp to send invoices automatically
                </div>
              </div>
              
              <ul style={{ fontSize: 13, color: '#666', lineHeight: 1.8, marginBottom: 24 }}>
                <li>Send invoices to loyalty customers via WhatsApp</li>
                <li>Completely free - no monthly fees</li>
                <li>Easy one-time setup (just scan a QR code)</li>
                <li>Works with your existing WhatsApp account</li>
              </ul>
              
              <button onClick={handleConnectWhatsApp}>
                🔗 Connect WhatsApp Now
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* QR Code Modal */}
      {showQRModal && (
        <div style={{
          position: 'fixed',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 32,
            maxWidth: 500,
            width: '90%'
          }}>
            <div style={{ marginBottom: 24 }}>
              <h3>Connect WhatsApp</h3>
              <button onClick={() => setShowQRModal(false)}>✖ Close</button>
            </div>
            
            {qrCode ? (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <img 
                    src={qrCode} 
                    alt="WhatsApp QR Code" 
                    style={{ width: 280, height: 280, borderRadius: 12 }} 
                  />
                </div>
                
                <ol style={{ fontSize: 13, lineHeight: 1.8 }}>
                  <li>Open <strong>WhatsApp</strong> on your phone</li>
                  <li>Tap <strong>Menu (⋮)</strong> or <strong>Settings</strong></li>
                  <li>Select <strong>Linked Devices</strong></li>
                  <li>Tap <strong>Link a Device</strong></li>
                  <li>Scan this QR code</li>
                </ol>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div>⏳ Generating QR code...</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

### Step 2: Add WhatsApp Invoice Sending to Sales Page

In your Sales/Checkout page, add the WhatsApp invoice functionality:

```typescript
import { useState } from 'react';
import { get, post } from '../services/api';

function Sales() {
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappInvoiceData, setWhatsappInvoiceData] = useState<any>(null);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);

  // Call this function after successfully completing a sale
  async function checkLoyaltyAndSendWhatsApp(invoiceData: any) {
    // Check if contact number exists
    if (!invoiceData.contact_no || !invoiceData.contact_no.trim()) {
      return; // No contact number, skip WhatsApp
    }

    try {
      // Check WhatsApp connection status
      const statusResult = await get('/whatsapp/status');
      if (!statusResult.isConnected) {
        return; // WhatsApp not connected, skip
      }

      // Prepare invoice data for WhatsApp modal
      setWhatsappInvoiceData(invoiceData);
      setShowWhatsAppModal(true);
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
      // Silently fail, don't interrupt the sale process
    }
  }

  async function sendWhatsAppInvoice() {
    if (!whatsappInvoiceData) return;

    setSendingWhatsApp(true);
    try {
      await post('/whatsapp/send-invoice', {
        contact_no: whatsappInvoiceData.contact_no,
        invoice_no: whatsappInvoiceData.invoice_no,
        date: whatsappInvoiceData.date,
        customer_name: whatsappInvoiceData.customer_name,
        items: whatsappInvoiceData.items,
        discount: whatsappInvoiceData.discount,
        total_amount: whatsappInvoiceData.total_amount,
        payment_type: whatsappInvoiceData.payment_type
      });

      alert('✅ Invoice sent via WhatsApp successfully!');
      setShowWhatsAppModal(false);
      setWhatsappInvoiceData(null);
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to send WhatsApp message';
      alert('❌ ' + errorMsg);
    } finally {
      setSendingWhatsApp(false);
    }
  }

  // After completing a sale, call this:
  async function handleCompleteSale() {
    // Your existing sale completion logic...
    
    // After sale is successful, prepare invoice data
    const invoiceData = {
      contact_no: customerPhone, // The customer's phone number
      invoice_no: generatedInvoiceNumber,
      date: new Date().toISOString(),
      customer_name: customerName,
      items: cartItems, // Array of { product_name, qty, selling_price }
      discount: discountPercentage,
      total_amount: finalTotal,
      payment_type: selectedPaymentMethod
    };
    
    // Check for loyalty customer and show WhatsApp option
    await checkLoyaltyAndSendWhatsApp(invoiceData);
  }

  return (
    <div>
      {/* Your existing sales UI */}
      
      {/* WhatsApp Send Modal */}
      {showWhatsAppModal && whatsappInvoiceData && (
        <div style={{
          position: 'fixed',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 32,
            maxWidth: 500,
            width: '90%'
          }}>
            <h3>📱 Send Invoice via WhatsApp?</h3>
            <p style={{ color: '#555', marginBottom: 20 }}>
              Send invoice details to <strong>{whatsappInvoiceData.customer_name || 'customer'}</strong> at{' '}
              <strong>{whatsappInvoiceData.contact_no}</strong>
            </p>
            
            <div style={{ fontSize: 13, color: '#555', marginBottom: 24 }}>
              📋 Invoice: {whatsappInvoiceData.invoice_no}<br/>
              💰 Total: Rs. {whatsappInvoiceData.total_amount.toFixed(2)}
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={() => { 
                  setShowWhatsAppModal(false); 
                  setWhatsappInvoiceData(null); 
                }}
                style={{ 
                  flex: 1, 
                  background: '#eee', 
                  color: '#333', 
                  border: 'none', 
                  padding: '12px', 
                  borderRadius: 8, 
                  fontWeight: 600, 
                  cursor: 'pointer' 
                }}
              >
                Skip
              </button>
              
              <button 
                onClick={sendWhatsAppInvoice} 
                disabled={sendingWhatsApp}
                style={{ 
                  flex: 1, 
                  background: '#4caf50', 
                  color: '#fff', 
                  border: 'none', 
                  padding: '12px', 
                  borderRadius: 8, 
                  fontWeight: 600, 
                  cursor: sendingWhatsApp ? 'not-allowed' : 'pointer',
                  opacity: sendingWhatsApp ? 0.6 : 1
                }}
              >
                {sendingWhatsApp ? 'Sending...' : '✅ Send Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Key Points for Sales Integration:**
- Call `checkLoyaltyAndSendWhatsApp()` after a successful sale
- The modal only appears if the customer has a phone number and WhatsApp is connected
- The process is non-blocking - if it fails, the sale still completes
- Users can choose to skip sending the WhatsApp message

---

## Testing the Integration

### Backend Testing

1. **Start your backend server:**
   ```bash
   cd backend
   npm start
   ```

2. **Check console logs for WhatsApp initialization:**
   ```
   Initializing WhatsApp client...
   WhatsApp client initialization started
   QR Code received
   QR Code generated successfully at [timestamp]
   ```

3. **Test API endpoints using curl or Postman:**

   Get connection status:
   ```bash
   curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
        http://localhost:5000/whatsapp/status
   ```

   Get QR code:
   ```bash
   curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
        http://localhost:5000/whatsapp/qr
   ```

### Frontend Testing

1. **Navigate to Settings page** - You should see the WhatsApp configuration section

2. **Click "Connect WhatsApp Now"** - A modal with QR code should appear

3. **Scan QR code:**
   - Open WhatsApp on your phone
   - Go to Settings → Linked Devices
   - Tap "Link a Device"
   - Scan the QR code from your screen

4. **Wait for connection** - The modal should close and status should show "Connected"

5. **Test invoice sending:**
   - Complete a sale with a loyalty customer who has a phone number
   - The WhatsApp modal should appear automatically
   - Click "Send Now" to send the invoice

### Verifying the Setup

**Check session persistence:**
1. Restart your backend server
2. The WhatsApp connection should automatically restore
3. No need to scan QR code again

**Check invoice format:**
1. Send a test invoice
2. Open WhatsApp on your phone
3. Verify the message formatting looks correct

---

## Troubleshooting

### Common Issues and Solutions

#### 1. QR Code Not Generating

**Symptoms:** QR code doesn't appear or takes too long

**Solutions:**
- Check console logs for errors
- Ensure `backend/data` directory exists and has write permissions
- On Linux/Docker, ensure Chromium is installed:
  ```bash
  apt-get update && apt-get install -y chromium-browser
  ```
- Restart the backend server

#### 2. Connection Drops After Restart

**Symptoms:** WhatsApp disconnects when server restarts

**Solutions:**
- Ensure `backend/data/.wwebjs_auth` directory is not deleted
- Check file permissions on the auth directory
- Verify the directory is not in `.gitignore` if deploying
- Don't clear browser cache/cookies on the WhatsApp Web session

#### 3. "Phone Number Not Registered on WhatsApp"

**Symptoms:** Error when sending invoice

**Solutions:**
- Verify the phone number is correct
- Ensure the country code logic is correct for your region
- Check that the number is actually registered on WhatsApp
- Test with `+` prefix: `+94771234567` format

#### 4. Puppeteer/Chrome Issues

**Symptoms:** Browser launch errors, timeout errors

**Solutions:**

For Windows:
```bash
# No action needed - Puppeteer includes Chrome
```

For Linux/Docker:
```bash
# Install required dependencies
apt-get update && apt-get install -y \
    chromium-browser \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils
```

**For Docker:** Add to your Dockerfile:
```dockerfile
FROM node:18-alpine

# Install Chromium
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

#### 5. Message Not Sending

**Symptoms:** Invoice modal works but message doesn't send

**Solutions:**
- Check WhatsApp connection status in Settings
- Verify the loyalty customer query matches your database schema
- Check backend console logs for detailed error messages
- Ensure phone number format is correct (with country code)
- Verify customer's phone number is registered on WhatsApp

#### 6. Session Persistence Issues

**Symptoms:** Need to scan QR code after every restart

**Solutions:**
- Check `LocalAuth` dataPath is correct
- Ensure directory has proper read/write permissions
- Don't delete `backend/data/.wwebjs_auth` folder
- Check if your hosting provider persists file storage

#### 7. Multiple QR Codes Appearing

**Symptoms:** QR code changes rapidly or multiple codes appear

**Solutions:**
- Use the `reconnect` endpoint to force a fresh connection
- Clear the `.wwebjs_auth` folder manually
- Restart backend server
- Ensure only one instance of the backend is running

---

## Advanced Configuration

### Customizing Invoice Message Format

Edit the `formatInvoiceMessage()` method in `whatsapp.ts`:

```typescript
private formatInvoiceMessage(data: any): string {
  // Customize with your business name, emojis, and formatting
  let message = `🎉 *YOUR BUSINESS NAME Invoice*\n`;
  // ... rest of formatting
  return message;
}
```

### Adding Attachments (Images/PDFs)

To send invoice PDFs or images:

```typescript
import { MessageMedia } from 'whatsapp-web.js';

// In your sendInvoiceMessage method:
const media = await MessageMedia.fromFilePath('./invoice.pdf');
await this.client.sendMessage(chatId, media, {
  caption: message
});
```

### Country Code Customization

Modify the phone number formatting logic:

```typescript
// For USA (+1)
if (!formattedNumber.startsWith('1')) {
  if (formattedNumber.startsWith('0')) {
    formattedNumber = formattedNumber.substring(1);
  }
  formattedNumber = '1' + formattedNumber;
}

// For UK (+44)
if (!formattedNumber.startsWith('44')) {
  if (formattedNumber.startsWith('0')) {
    formattedNumber = formattedNumber.substring(1);
  }
  formattedNumber = '44' + formattedNumber;
}
```

### Environment Variables

Add to your `.env` file:

```env
# WhatsApp Configuration
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser  # For Linux/Docker
WHATSAPP_SESSION_PATH=./data/.wwebjs_auth            # Custom session path
```

---

## Production Deployment Checklist

- [ ] Install required dependencies (`whatsapp-web.js`, `qrcode`)
- [ ] Create `backend/data` directory with proper permissions
- [ ] Add `.wwebjs_auth` to `.gitignore` if needed
- [ ] Configure Puppeteer for your environment (Windows/Linux/Docker)
- [ ] Test QR code generation and connection
- [ ] Test invoice sending to a real WhatsApp number
- [ ] Verify session persistence after server restart
- [ ] Set up monitoring for WhatsApp connection status
- [ ] Document phone number format for your region
- [ ] Customize invoice message template
- [ ] Test error handling and edge cases
- [ ] Ensure proper authentication on all endpoints
- [ ] Monitor backend logs for WhatsApp-related errors

---

## Security Considerations

1. **Authentication:** All WhatsApp endpoints require JWT authentication
2. **Rate Limiting:** Consider adding rate limiting to prevent spam
3. **Data Validation:** Validate all input data before sending messages
4. **Session Security:** Protect the `.wwebjs_auth` directory (don't expose publicly)
5. **Error Handling:** Don't expose sensitive error details to frontend
6. **Customer Verification:** Only send to verified loyalty customers

---

## Support and Resources

- **whatsapp-web.js Documentation:** https://docs.wwebjs.dev/
- **QRCode Library:** https://github.com/soldair/node-qrcode
- **Puppeteer Troubleshooting:** https://pptr.dev/troubleshooting

---

## FAQ

**Q: Does this cost money?**
A: No, it's completely free. It uses your existing WhatsApp Web session.

**Q: Can I use this for bulk messaging?**
A: Be careful - WhatsApp has spam policies. This is designed for transactional messages (invoices).

**Q: What happens if my phone's WhatsApp is offline?**
A: Messages will be queued and sent when your phone comes online.

**Q: Can I send messages to non-saved contacts?**
A: Yes, as long as the number is registered on WhatsApp.

**Q: How long does the session last?**
A: Sessions persist indefinitely until you disconnect or WhatsApp logs out the session.

**Q: Can I run multiple instances?**
A: Yes, but each needs its own session and QR code scan.

---

## Summary

This WhatsApp integration provides a free, reliable way to send invoice messages to customers. The key components are:

1. **Backend Service** - Manages WhatsApp Web connection via Puppeteer
2. **API Routes** - Handles connection, disconnection, and message sending
3. **Frontend UI** - QR code scanning and status monitoring
4. **Sales Integration** - Automatic invoice sending after checkout

The integration is production-ready and handles session persistence, error recovery, and cross-platform compatibility.

Good luck with your implementation! 🚀
