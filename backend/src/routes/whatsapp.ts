import express from 'express';
import whatsappService from '../services/whatsapp';
import { authenticateToken, checkRole } from '../middleware/auth';

const router = express.Router();

// Get status
router.get('/status', authenticateToken, (req, res) => {
  try {
    const status = whatsappService.getStatus();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get QR Code
router.get('/qr', authenticateToken, (req, res) => {
  try {
    const qrCode = whatsappService.getQRCode();
    res.json({ qrCode });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize client
router.post('/initialize', authenticateToken, checkRole(['admin', 'manager']), async (req, res) => {
  try {
    // Run in background to avoid blocking
    whatsappService.initialize().catch(err => {
      console.error('Background initialization error:', err);
    });
    res.json({ message: 'Initialization started' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Disconnect client
router.post('/disconnect', authenticateToken, checkRole(['admin', 'manager']), async (req, res) => {
  try {
    await whatsappService.disconnect();
    res.json({ message: 'Disconnected successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Send invoice
router.post('/send-invoice', authenticateToken, async (req, res) => {
  try {
    // Check if data is wrapped in { phoneNumber, invoiceData } or sent flat
    let phoneNumber, invoiceData;
    
    if (req.body.phoneNumber && req.body.invoiceData) {
      phoneNumber = req.body.phoneNumber;
      invoiceData = req.body.invoiceData;
    } else {
      // Flat structure (used by Sales.tsx fallback)
      phoneNumber = req.body.contact_no;
      invoiceData = req.body;
    }
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Missing phone number (contact_no)' });
    }

    await whatsappService.sendInvoiceMessage(phoneNumber, invoiceData);
    res.json({ success: true, message: 'Invoice sent successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reconnect
router.post('/reconnect', authenticateToken, checkRole(['admin', 'manager']), async (req, res) => {
  try {
    whatsappService.reconnect().catch(err => {
      console.error('Background reconnection error:', err);
    });
    res.json({ message: 'Reconnection started' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
