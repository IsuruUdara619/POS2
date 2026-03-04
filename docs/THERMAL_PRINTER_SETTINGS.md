# Thermal Printer Settings Guide

## Overview
The Thermal Printer Settings feature allows administrators to configure and test thermal receipt printing with customizable options for font size and paper length.

## Features
✅ **Manual Font Size Adjustment** - Small (8px), Medium (12px), Large (16px)
✅ **Paper Length Selection** - 58mm or 80mm thermal paper
✅ **Test Print Functionality** - Print test receipts to verify settings
✅ **Real-time Configuration** - Settings are saved to the database and applied immediately
✅ **Admin-Only Access** - Settings page restricted to administrators

## Accessing Printer Settings

1. **Login as Administrator**
   - Use admin credentials to access the system
   - Only admin users can access the Settings page

2. **Navigate to Settings**
   - Click on the **Settings** icon in the sidebar (gear icon)
   - The Settings page will display the current printer configuration

## Configuring Printer Settings

### Font Size Options
- **Small (8px)** - Compact text, fits more content per line
- **Medium (12px)** - Default size, balanced readability
- **Large (16px)** - Larger text for better visibility

### Paper Length Options
- **58mm** - For smaller thermal printers (standard size)
- **80mm** - For larger thermal printers (wider format)

### How to Update Settings

1. Select your preferred **Font Size** from the dropdown
2. Select your **Paper Length** from the dropdown
3. Click the **💾 Save Settings** button
4. Settings are immediately saved and will be applied to all future prints

## Testing Your Printer

### Test Print Feature

<function_calls>
The **🖨️ Test Print** button allows you to verify your printer settings before printing actual receipts.

**What the Test Print Includes:**
- Sample header text
- Example transaction items with prices
- Total amount
- Footer with date/time

**How to Use Test Print:**

1. Configure your desired font size and paper length
2. Save the settings (if you made changes)
3. Click the **🖨️ Test Print** button
4. A test receipt will be generated and sent to your thermal printer
5. Verify the output looks correct

**If the test print doesn't work:**
- Check that your thermal printer is connected
- Verify printer drivers are installed
- Ensure the printer is set as the default printer
- Check the printer is powered on and has paper

## Database Schema

The printer settings are stored in the `printer_settings` table:

```sql
CREATE TABLE IF NOT EXISTS printer_settings (
    id SERIAL PRIMARY KEY,
    font_size VARCHAR(10) NOT NULL DEFAULT 'medium',
    paper_length INTEGER NOT NULL DEFAULT 58,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### GET /api/printer-settings
Retrieve current printer settings (requires authentication).

**Response:**
```json
{
  "font_size": "medium",
  "paper_length": 58
}
```

### PUT /api/printer-settings
Update printer settings (requires authentication).

**Request Body:**
```json
{
  "font_size": "large",
  "paper_length": 80
}
```

**Response:**
```json
{
  "message": "Printer settings updated successfully"
}
```

### POST /api/test-print
Generate and print a test receipt (requires authentication).

**Request Body:**
```json
{
  "font_size": "medium",
  "paper_length": 58
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test print generated successfully"
}
```

## Integration with Sales Module

The printer settings are automatically used when printing receipts from the Sales page. No additional configuration is needed - the system will read the saved settings and apply them to all thermal printer outputs.

## Troubleshooting

### Settings Not Saving
- **Issue:** Changes don't persist after refresh
- **Solution:** Check database connection and ensure the printer_settings table exists

### Test Print Not Working
- **Issue:** Test print button doesn't produce output
- **Solution:** 
  - Verify thermal printer is connected and powered on
  - Check printer has paper loaded
  - Ensure printer drivers are installed
  - Try printing a test page from your OS to verify printer works

### Font Size Not Applied
- **Issue:** Receipts still print with old font size
- **Solution:**
  - Save settings before printing
  - Clear browser cache
  - Restart the backend server

### Access Denied Error
- **Issue:** Cannot access Settings page
- **Solution:** 
  - Login with admin credentials
  - Only admin role can access printer settings
  - Check your user role in the database

## Installation Checklist

✅ Database table created (`sql/create_printer_settings.sql`)
✅ Backend routes configured (`backend/src/routes/printerSettings.ts`)
✅ Frontend Settings page created (`frontend/src/pages/Settings.tsx`)
✅ Settings route added to App.tsx
✅ Settings menu item added to Sidebar
✅ Frontend rebuilt and deployed
✅ Backend server running

## Command Reference

### Create Database Table
```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d Heaven_Bakers -f sql/create_printer_settings.sql
```

### Build Frontend
```bash
cd frontend && npm run build
```

### Deploy Frontend Build
```bash
cp -r frontend/dist/* frontend-build/
```

### Start Backend Server
```bash
cd backend && npm start > ../logs/backend.log 2>&1 &
```

## Future Enhancements

Potential improvements for future versions:
- Additional font size options
- Custom paper width configuration
- Print preview before sending to printer
- Multiple printer profiles
- Receipt template customization
- Logo/header image configuration

## Support

If you encounter issues with the thermal printer settings:
1. Check the backend logs: `tail -f logs/backend.log`
2. Verify database connection
3. Test printer from operating system settings
4. Ensure all dependencies are installed

For technical support, refer to the main documentation or contact your system administrator.
