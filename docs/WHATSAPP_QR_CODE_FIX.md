# WhatsApp QR Code Browser Conflict Fix

## Problem Description

The WhatsApp integration was failing to generate QR codes with the following error:

```
Error: The browser is already running for /home/gayan/.config/bloomswiftpos/whatsapp-session/session. 
Use a different `userDataDir` or stop the running browser first.
```

### Root Cause

When the WhatsApp service initializes, it launches a Chrome/Chromium browser instance via Puppeteer to connect to WhatsApp Web. If:
1. The application crashes or is force-closed
2. The browser process doesn't terminate properly
3. The user tries to connect WhatsApp again

The old browser process remains running in the background, and when a new connection attempt is made, Puppeteer tries to start another browser with the same user data directory, causing a conflict.

## Solution Implemented

### 1. Orphaned Browser Detection & Cleanup

Added `killOrphanedBrowsers()` method to detect and terminate any Chrome/Chromium processes using our WhatsApp session directory:

```javascript
async killOrphanedBrowsers() {
  // Finds and kills processes matching: chrome.*whatsapp-session or chromium.*whatsapp-session
  await execPromise(`pkill -f "chrome.*${sessionPath}" || true`);
  await execPromise(`pkill -f "chromium.*${sessionPath}" || true`);
}
```

### 2. Pre-initialization Cleanup

Modified `initialize()` to automatically clean up orphaned browsers before starting:

```javascript
async initialize() {
  // First, clean up any orphaned browser processes
  await this.killOrphanedBrowsers();
  
  // Then proceed with normal initialization
  // ...
}
```

### 3. Enhanced Disconnect Cleanup

Improved `disconnect()` method to ensure browser processes are killed even if the client destroy fails:

```javascript
async disconnect() {
  // Try to destroy client gracefully
  try {
    await this.client.destroy();
  } catch (error) {
    // Don't throw - continue with cleanup
  }
  
  // Force kill any remaining browser processes
  await this.killOrphanedBrowsers();
}
```

### 4. Graceful App Shutdown

Added WhatsApp service cleanup to the Electron app's `before-quit` handler:

```javascript
app.on('before-quit', async (event) => {
  event.preventDefault();
  
  // Cleanup WhatsApp service first
  await whatsappService.disconnect();
  
  // Then other cleanup...
  app.exit(0);
});
```

### 5. Browser Process Tracking

Added `browserProcess` property to track the browser instance (for future enhancements).

## Manual Cleanup Script

A cleanup script is also provided for manual fixes:

```bash
./CLEAR_WHATSAPP_SESSION.sh
```

This script:
- Stops all BloomSwiftPOS processes
- Kills orphaned Chrome/Chromium processes
- Clears WhatsApp session data
- Fixes permission issues

## Testing the Fix

### Test Case 1: Normal Connection
1. Start the application
2. Go to Settings → WhatsApp
3. Click "Connect WhatsApp"
4. QR code should appear within 5-10 seconds
5. Scan with your phone
6. Connection should complete

### Test Case 2: Recovery from Crash
1. Start application and connect WhatsApp
2. Force kill the application (kill -9)
3. Start application again
4. Try to connect WhatsApp
5. Should automatically clean up old browser and generate new QR code

### Test Case 3: Reconnection
1. Connect WhatsApp
2. Click "Disconnect"
3. Wait 2 seconds
4. Click "Connect WhatsApp" again
5. New QR code should appear immediately

### Test Case 4: Multiple Connection Attempts
1. Click "Connect WhatsApp"
2. Before QR appears, click it again multiple times
3. Should handle gracefully without errors

## Files Modified

1. **electron/services/whatsapp-native.js**
   - Added `killOrphanedBrowsers()` method
   - Modified `initialize()` to cleanup before starting
   - Enhanced `disconnect()` with forced cleanup
   - Added browser process tracking

2. **electron/main.js**
   - Added WhatsApp cleanup to `before-quit` handler
   - Ensures browser termination on app exit

3. **docs/WHATSAPP_QR_CODE_FIX.md** (this file)
   - Complete documentation of the fix

## Prevention Measures

The following measures now prevent this issue:

1. **Auto-cleanup on initialization** - Every time WhatsApp initializes, it checks for and kills orphaned browsers
2. **Forced cleanup on disconnect** - Disconnect always kills browser processes, even if client.destroy() fails
3. **App exit cleanup** - Browser is properly terminated when application closes
4. **Process tracking** - Infrastructure added to track browser PIDs for better management

## Known Limitations

1. The `pkill` command is Linux-specific. On Windows, this would need adjustment
2. If browser processes are hung, they may require `kill -9` (handled by script)
3. Very rapid reconnection attempts (< 1 second apart) may still have race conditions

## Future Improvements

1. Cross-platform browser process management
2. Browser PID file tracking for more precise cleanup
3. Health monitoring for browser processes
4. Automatic recovery on browser crashes
5. Better error messages for common failure scenarios

## Support

If you still encounter QR code generation issues:

1. Run the cleanup script: `./CLEAR_WHATSAPP_SESSION.sh`
2. Check for orphaned processes: `ps aux | grep -i "chrome.*whatsapp"`
3. Manually kill if needed: `pkill -9 -f "chrome.*whatsapp-session"`
4. Restart the application

## Version History

- **v1.0** (2026-02-03): Initial fix implemented
  - Added orphaned browser detection
  - Automatic cleanup on initialization
  - Enhanced disconnect method
  - App shutdown cleanup
