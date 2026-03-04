import { ThermalPrinter, PrinterTypes } from 'node-thermal-printer';
import * as fs from 'fs';
import * as path from 'path';
import { getPrinters } from 'pdf-to-printer';
import * as os from 'os';

interface ReceiptData {
  invoice_no?: string;
  date?: string;
  customer_name?: string;
  items: Array<{
    product_name: string;
    qty: number;
    selling_price: number;
    item_discount?: number; // Per-item discount percentage
  }>;
  discount?: number;
  loyalty_discount?: number; // Loyalty customer discount (e.g., 12%)
  total_amount: number;
  payment_type?: string;
  amount_given?: number;
  change_amount?: number;
}

interface PrinterSettings {
  font_header?: number;
  font_items?: number;
  font_subtotal?: number;
  font_total?: number;
  font_payment?: number;
  line_spacing?: number;
}

export class ESCPOSPrinter {
  private printer: ThermalPrinter;
  
  constructor(printerPath: string = '/dev/usb/lp0') {
    this.printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,  // XP-80C is EPSON compatible
      interface: printerPath,
      removeSpecialCharacters: false,
      lineCharacter: '=',
      width: 46,  // Adjusted width for 80mm thermal paper (with margin)
      options: {
        timeout: 5000,
      }
    });
  }

  /**
   * Print receipt using ESC/POS commands
   */
  async printReceipt(data: ReceiptData, settings: PrinterSettings = {}): Promise<void> {
    try {
      // Connect to printer
      const isConnected = await this.printer.isPrinterConnected();
      if (!isConnected) {
        // On Windows, isPrinterConnected() might fail for network shares/USB, but writing might still work
        if (os.platform() !== 'win32') {
          throw new Error('Printer not connected');
        }
      }

      // Clear any previous data
      this.printer.clear();

      // ===== LOGO =====
      // Print logo at the top of the receipt
      const logoPath = '/home/gayan/Desktop/Project Files Weerasingha_Hardware_v4.0/Weerasingha_Hardware/Assets/logo.png';
      try {
        if (fs.existsSync(logoPath)) {
          this.printer.alignCenter();
          await this.printer.printImage(logoPath);
          this.printer.newLine();
          console.log('✅ Logo printed successfully');
        } else {
          console.warn('⚠️ Logo file not found at:', logoPath);
        }
      } catch (logoError) {
        console.error('❌ Error printing logo:', logoError);
        // Continue with receipt printing even if logo fails
      }

      // ===== HEADER (ULTRA-COMPACT) =====
      this.printer.alignCenter();
      this.printer.setTextNormal();
      this.printer.bold(true);
      this.printer.println('Demo POS System');
      this.printer.bold(false);
      
      this.printer.println('No. 04, 8th Mile Post,');
      this.printer.println('Hansayapalama, Aralaganwila');
      this.printer.println('0272050404 / 0766132181');
      
      // Add system timestamp
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const timeStamp = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
      this.printer.println(timeStamp);
      
      this.printer.newLine();
     
      this.printer.println('Powered by:');
      this.printer.println('BloomSwiftPOS');
      
      this.printer.drawLine();

      // ===== INVOICE DETAILS =====
      this.printer.alignLeft();
      this.printer.setTextNormal();
      
      if (data.invoice_no) {
        this.printer.println(`Invoice: ${data.invoice_no}`);
      }
      
      if (data.date) {
        const formattedDate = new Date(data.date).toLocaleDateString('en-GB');
        this.printer.println(`Date: ${formattedDate}`);
      }
      
      if (data.customer_name) {
        // Truncate customer name if too long
        const custName = data.customer_name.length > 25 ? data.customer_name.substring(0, 25) : data.customer_name;
        this.printer.println(`Customer: ${custName}`);
      }
      
      this.printer.drawLine();

      // ===== ITEMS HEADER =====
      // Set smaller font size for items section to prevent text wrapping
      this.printer.setTextSize(0, 0);
      
      // Enable inverted printing (black background, white text) for header
      this.printer.invert(true);
      this.printer.bold(true);
      
      this.printer.tableCustom([
        { text: 'Item', align: 'LEFT', width: 0.45, bold: true },
        { text: 'Qty', align: 'LEFT', width: 0.15, bold: true },
        { text: 'Price', align: 'LEFT', width: 0.40, bold: true }
      ]);
      
      // Disable inverted printing immediately (back to normal white background, black text)
      this.printer.invert(false);
      this.printer.bold(false);
      
      // Draw separator line (now with normal printing)
      this.printer.drawLine();

      // ===== ITEMS =====
      let subtotal = 0;
      let totalItemDiscounts = 0;
      
      for (const item of data.items) {
        const itemLineTotal = item.qty * item.selling_price;
        let itemTotal = itemLineTotal;
        
        // Apply per-item discount if present
        if (item.item_discount && item.item_discount > 0) {
          const itemDiscountAmount = itemLineTotal * (item.item_discount / 100);
          itemTotal = itemLineTotal - itemDiscountAmount;
          totalItemDiscounts += itemDiscountAmount;
        }
        
        subtotal += itemTotal;
        
        // Display item with discount indicator if applicable
        const itemName = item.item_discount && item.item_discount > 0 
          ? `${item.product_name} (${item.item_discount}% off)`
          : item.product_name;
        
        this.printer.tableCustom([
          { text: itemName, align: 'LEFT', width: 0.45 },
          { text: item.qty.toString(), align: 'LEFT', width: 0.15, bold: true },
          { text: `Rs. ${itemTotal.toFixed(2)}`, align: 'LEFT', width: 0.40, bold: true }
        ]);
      }
      
      // Reset font size back to normal after items section
      this.printer.setTextNormal();
      
      this.printer.drawLine();

      // ===== TOTALS =====
      // Show subtotal if there are any discounts
      const hasAnyDiscount = (data.loyalty_discount && data.loyalty_discount > 0) || 
                            (data.discount && data.discount > 0) || 
                            totalItemDiscounts > 0;
      
      if (hasAnyDiscount) {
        this.printer.tableCustom([
          { text: 'Subtotal:', align: 'LEFT', width: 0.60 },
          { text: `Rs. ${subtotal.toFixed(2)}`, align: 'LEFT', width: 0.40 }
        ]);
        
        // Show loyalty discount separately
        if (data.loyalty_discount && data.loyalty_discount > 0) {
          const loyaltyDiscountAmount = subtotal * (data.loyalty_discount / 100);
          this.printer.tableCustom([
            { text: `Loyalty Discount (${data.loyalty_discount}%):`, align: 'LEFT', width: 0.60 },
            { text: `-Rs. ${loyaltyDiscountAmount.toFixed(2)}`, align: 'LEFT', width: 0.40 }
          ]);
          subtotal -= loyaltyDiscountAmount;
        }
        
        // Show overall discount
        if (data.discount && data.discount > 0) {
          const discountAmount = subtotal * (data.discount / 100);
          this.printer.tableCustom([
            { text: `Additional Discount (${data.discount}%):`, align: 'LEFT', width: 0.60 },
            { text: `-Rs. ${discountAmount.toFixed(2)}`, align: 'LEFT', width: 0.40 }
          ]);
        }
        
        this.printer.drawLine();
      }
      
      this.printer.bold(true);
      this.printer.setTextNormal();
      this.printer.tableCustom([
        { text: 'TOTAL:', align: 'LEFT', width: 0.60, bold: true },
        { text: `Rs. ${data.total_amount.toFixed(2)}`, align: 'LEFT', width: 0.40, bold: true }
      ]);
      this.printer.bold(false);
      
      this.printer.drawLine();

      // ===== PAYMENT DETAILS =====
      if (data.payment_type) {
        this.printer.println(`Payment: ${data.payment_type}`);
      }
      
      if (data.payment_type === 'Cash Payment' && data.amount_given) {
        this.printer.tableCustom([
          { text: 'Amount Given:', align: 'LEFT', width: 0.60 },
          { text: `Rs. ${data.amount_given.toFixed(2)}`, align: 'LEFT', width: 0.40 }
        ]);
        
        if (data.change_amount !== undefined) {
          this.printer.tableCustom([
            { text: 'Change:', align: 'LEFT', width: 0.60 },
            { text: `Rs. ${data.change_amount.toFixed(2)}`, align: 'LEFT', width: 0.40 }
          ]);
        }
      }
      
      this.printer.drawLine();

      // ===== FOOTER =====
      this.printer.newLine();
      this.printer.alignCenter();
      this.printer.bold(true);
      this.printer.println('Thank you for your visit!');
      this.printer.bold(false);
      this.printer.setTextNormal();
      this.printer.println('Exchanges are possible within 7 days');
      
      this.printer.drawLine();
      
      // Open cash drawer
      this.printer.openCashDrawer();
      
      // Cut paper
      this.printer.cut();

      // Execute print
      await this.printer.execute();
      
      console.log('✅ ESC/POS receipt printed successfully');
    } catch (error) {
      console.error('❌ ESC/POS print error:', error);
      throw error;
    }
  }

  /**
   * Test printer connection and print test page
   */
  async testPrint(): Promise<void> {
    try {
      const isConnected = await this.printer.isPrinterConnected();
      if (!isConnected) {
        throw new Error('Printer not connected');
      }

      this.printer.clear();
      this.printer.alignCenter();
      this.printer.bold(true);
      this.printer.setTextSize(1, 1);
      this.printer.println('TEST PRINT');
      this.printer.bold(false);
      this.printer.setTextNormal();
      this.printer.newLine();
      this.printer.println('Printer: XP-80C');
      this.printer.println(new Date().toLocaleString());
      this.printer.newLine();
      this.printer.println('Connection: OK');
      this.printer.drawLine();
      this.printer.cut();
      
      await this.printer.execute();
      
      console.log('✅ Test print successful');
    } catch (error) {
      console.error('❌ Test print failed:', error);
      throw error;
    }
  }

  /**
   * Get printer status
   */
  async getStatus(): Promise<{ connected: boolean; error?: string }> {
    try {
      const isConnected = await this.printer.isPrinterConnected();
      return { connected: isConnected };
    } catch (error: any) {
      return { connected: false, error: error.message };
    }
  }
}

/**
 * Find available printer device paths
 */
export async function findPrinterDevice(printerName?: string): Promise<string | null> {
  const isWindows = os.platform() === 'win32';

  if (isWindows) {
    try {
      const printers = await getPrinters();
      console.log('Available Windows printers:', printers);
      
      if (printers.length === 0) {
        console.warn('⚠️ No Windows printers found');
        return null;
      }

      // If specific printer name requested, try to find it
      if (printerName) {
        const found = printers.find(p => p.name === printerName || p.deviceId === printerName);
        if (found) {
          // Return network path for shared printer (standard Windows way for raw printing)
          // Note: Printer must be shared!
          // If not shared, we can try to return just the name, but node-thermal-printer might need specific format
          // For now, let's assume it's shared as "PrinterName" or we use raw name
          const name = found.name || found.deviceId;
          console.log(`✅ Found requested Windows printer: ${name}`);
          return `\\\\localhost\\${name}`;
        }
      }

      // Fallback: look for common thermal printer names
      const thermalKeywords = ['POS', 'Thermal', 'Receipt', 'XP-', 'EPSON', 'TM-'];
      const thermalPrinter = printers.find(p => {
        const name = (p.name || p.deviceId || '').toUpperCase();
        return thermalKeywords.some(k => name.includes(k));
      });

      if (thermalPrinter) {
        const name = thermalPrinter.name || thermalPrinter.deviceId;
        console.log(`✅ Found likely thermal printer: ${name}`);
        return `\\\\localhost\\${name}`;
      }

      // Last resort: pick the first one
      const first = printers[0];
      const name = first.name || first.deviceId;
      console.log(`⚠️ Using first available printer: ${name}`);
      return `\\\\localhost\\${name}`;

    } catch (error) {
      console.error('Error finding Windows printers:', error);
      return null;
    }
  }

  // Linux/Unix logic
  const possiblePaths = [
    '/dev/usb/lp0',
    '/dev/usb/lp1',
    '/dev/lp0',
    '/dev/lp1',
    'tcp://192.168.1.100:9100', // Network printer example
  ];

  for (const path of possiblePaths) {
    if (path.startsWith('tcp://')) {
      // For network printers, we can't check file existence
      return path;
    }
    
    try {
      if (fs.existsSync(path)) {
        console.log('✅ Found printer device:', path);
        return path;
      }
    } catch (error) {
      // Continue checking other paths
    }
  }

  console.warn('⚠️ No printer device found in standard paths');
  return null;
}
