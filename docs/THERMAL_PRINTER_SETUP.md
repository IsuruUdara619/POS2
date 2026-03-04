# Thermal Printer Setup Guide (XP-80C)

This guide will help you set up your XP-80C thermal printer for receipt printing on Linux.

## Prerequisites

- XP-80C thermal printer
- USB cable
- Linux system with CUPS installed

## Step 1: Install CUPS (if not already installed)

```bash
# Update package list
sudo apt update

# Install CUPS and related tools
sudo apt install cups cups-client

# Start CUPS service
sudo systemctl start cups

# Enable CUPS to start on boot
sudo systemctl enable cups

# Check CUPS status
systemctl status cups
```

## Step 2: Connect Your Printer

1. Connect your XP-80C printer to your computer via USB
2. Turn on the printer
3. Check if the printer is detected:

```bash
# List USB devices (should show your printer)
lsusb

# Check if printer is detected by CUPS
lpstat -p -d
```

## Step 3: Add Printer to CUPS

### Option A: Using CUPS Web Interface (Recommended)

1. Open your web browser and navigate to:
   ```
   http://localhost:631
   ```

2. Click on **Administration** > **Add Printer**

3. You may need to log in with your system credentials

4. Select your **XP-80C** printer from the list of local printers

5. Give it a name: `XP-80C` (this must match the name in your .env file)

6. Share the printer if you want to use it from other computers (optional)

7. Select the appropriate driver:
   - Look for "Generic" or "Raw Queue"
   - Or "Xprinter XP-80C" if available

8. Set as default printer (optional)

9. Click **Add Printer**

### Option B: Using Command Line

```bash
# Add printer using lpadmin
sudo lpadmin -p XP-80C -E -v usb://Xprinter/XP-80C -m drv:///sample.drv/generic.ppd

# Set as default (optional)
sudo lpadmin -d XP-80C

# Enable the printer
sudo cupsenable XP-80C
sudo cupsaccept XP-80C
```

## Step 4: Test the Printer

### Test from Command Line

```bash
# Simple text test
echo "Test Print from Command Line" | lp -d XP-80C

# Check printer status
lpstat -p XP-80C

# View print queue
lpq -P XP-80C
```

### Test from Application

1. Start your backend server
2. The application now has a printer test endpoint
3. You can test it from the Settings page (see below)

## Step 5: Configure Application

### Update .env File

Edit your `backend/.env` file (or create it from `.env.example`):

```env
# Thermal Printer Configuration
THERMAL_PRINTER_NAME=XP-80C
```

**Note:** The printer name must **exactly match** the name you gave it in CUPS.

### Restart Backend Server

After updating the .env file, restart your backend server:

```bash
# If running in development
cd backend
npm start

# If running with Docker
docker-compose restart backend

# If running as Electron app
# Just restart the application
```

## Step 6: Verify Installation

1. Log in to your application
2. Navigate to **Settings** page
3. Look for **Printer Configuration** section
4. Click **Test Printer** button
5. You should see a test receipt print

## Troubleshooting

### Printer Not Found

**Problem:** Application says "Printer 'XP-80C' not found"

**Solutions:**
```bash
# List all available printers
lpstat -p -d

# Check if CUPS is running
systemctl status cups

# If not running, start it
sudo systemctl start cups

# Verify printer name matches exactly
lpstat -p | grep -i xp
```

### CUPS Not Running

**Problem:** "CUPS printing system is not running"

**Solutions:**
```bash
# Start CUPS
sudo systemctl start cups

# Enable auto-start on boot
sudo systemctl enable cups

# Check status
systemctl status cups
```

### Printer Shows but Won't Print

**Problem:** Printer is detected but prints nothing or errors

**Solutions:**

1. **Check printer status:**
   ```bash
   lpstat -p XP-80C
   # Should show "enabled" and "idle"
   ```

2. **Enable the printer:**
   ```bash
   sudo cupsenable XP-80C
   sudo cupsaccept XP-80C
   ```

3. **Check for errors:**
   ```bash
   # View error log
   sudo tail -f /var/log/cups/error_log
   ```

4. **Clear print queue:**
   ```bash
   # Cancel all jobs
   sudo cancel -a
   
   # Restart CUPS
   sudo systemctl restart cups
   ```

5. **Check USB connection:**
   ```bash
   # Verify USB device is connected
   lsusb | grep -i printer
   
   # Check device permissions
   ls -l /dev/usb/lp*
   ```

### Permission Denied Errors

**Problem:** Permission errors when trying to print

**Solutions:**
```bash
# Add your user to lpadmin group
sudo usermod -aG lpadmin $USER

# Add your user to lp group
sudo usermod -aG lp $USER

# Log out and log back in for changes to take effect
```

### Wrong Printer Name

**Problem:** Printer name in CUPS doesn't match application configuration

**Solutions:**

1. **Find correct printer name:**
   ```bash
   lpstat -p
   ```

2. **Update .env file** with exact name from lpstat output

3. **Or rename printer in CUPS:**
   ```bash
   # Remove old printer
   sudo lpadmin -x OldName
   
   # Add with correct name
   sudo lpadmin -p XP-80C -E -v usb://Xprinter/XP-80C -m drv:///sample.drv/generic.ppd
   ```

## Common XP-80C Issues

### Paper Not Feeding

1. Check if paper roll is inserted correctly
2. Open printer cover and reseat paper roll
3. Clean the paper feed mechanism

### Faint or No Printing

1. Check thermal paper quality (should be thermal paper, not regular paper)
2. Clean the thermal print head with alcohol
3. Replace thermal paper if old or expired

### Printer Not Detected in USB

1. Try a different USB port
2. Check if USB cable is working
3. Restart the printer
4. Check dmesg for USB errors:
   ```bash
   dmesg | grep -i usb | tail -20
   ```

## Environment Variables Reference

### backend/.env

```env
# Thermal Printer Configuration
# Set this to the exact name of your printer as shown in CUPS
THERMAL_PRINTER_NAME=XP-80C

# Alternative names if your printer shows up differently:
# THERMAL_PRINTER_NAME=XPrinter-XP-80C
# THERMAL_PRINTER_NAME=Xprinter_XP_80C
```

## API Endpoints

The application now provides these printer-related endpoints:

### Get Available Printers
```
GET /api/print/printers
Authorization: Bearer <token>

Response:
{
  "success": true,
  "cupsRunning": true,
  "currentPrinter": "XP-80C",
  "printers": ["XP-80C", "PDF", "Another-Printer"],
  "error": null
}
```

### Test Printer
```
POST /api/print/test-printer
Authorization: Bearer <token>
Content-Type: application/json

{
  "printerName": "XP-80C"  // Optional, uses default if not provided
}

Response:
{
  "success": true,
  "message": "Test print sent to XP-80C successfully!"
}
```

### Print Receipt
```
POST /api/print/receipt
Authorization: Bearer <token>
Content-Type: application/json

{
  "invoice_no": "INV-001",
  "date": "2026-01-26",
  "customer_name": "John Doe",
  "items": [
    {
      "product_name": "Product 1",
      "qty": 2,
      "selling_price": 100
    }
  ],
  "discount": 10,
  "total_amount": 180,
  "payment_type": "Cash Payment",
  "amount_given": 200,
  "change_amount": 20
}

Response on Success:
{
  "success": true,
  "message": "Receipt printed successfully"
}

Response on Error:
{
  "success": false,
  "message": "Printer not available",
  "error": "Printer 'XP-80C' not found.\n\nAvailable printers:\n  - PDF\n  - Another-Printer",
  "availablePrinters": ["PDF", "Another-Printer"]
}
```

## Additional Resources

- [CUPS Documentation](https://www.cups.org/doc/)
- [XP-80C User Manual](https://www.xprinter.net/)
- [Ubuntu Printing Guide](https://help.ubuntu.com/community/Printers)

## Support

If you continue to have issues:

1. Check the backend logs for detailed error messages
2. Run the diagnostic commands in the Troubleshooting section
3. Verify your printer works with a basic text test from command line
4. Contact support with the output of:
   ```bash
   lpstat -p -d
   systemctl status cups
   lsusb | grep -i printer
   ```

## Quick Setup Checklist

- [ ] CUPS installed and running
- [ ] Printer connected via USB and powered on
- [ ] Printer detected by lsusb
- [ ] Printer added to CUPS with name "XP-80C"
- [ ] Test print successful from command line
- [ ] THERMAL_PRINTER_NAME set in backend/.env
- [ ] Backend server restarted
- [ ] Test print successful from application

---

**Last Updated:** January 26, 2026
