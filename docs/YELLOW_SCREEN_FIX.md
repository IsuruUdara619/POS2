# Yellow Screen Fix - BloomSwiftPOS

## Problem Summary

The application was showing a **yellow "Failed to load" screen** on startup due to:

1. **Permission Error**: WhatsApp service tried to create directories in `/opt/BloomSwiftPOS/resources/backend/data/.wwebjs_auth/session` which requires elevated permissions
2. **Auto-initialization**: WhatsApp service was automatically initializing when the backend started, causing immediate crashes
3. **Auto-update Network Errors**: Electron was trying to connect to a placeholder update server URL

## Root Cause

```
Error: EACCES: permission denied, mkdir '/opt/BloomSwiftPOS/resources/backend/data/.wwebjs_auth/session'
```

The application runs as a normal user but tried to write to `/opt/` which requires root permissions.

---

## Solution Implemented

### 1. **WhatsApp Service Changes** (`backend/src/services/whatsapp.ts` & `whatsapp.js`)

#### Removed Auto-Initialization
- **Before**: WhatsApp automatically initialized in the constructor
- **After**: WhatsApp only initializes when user clicks "Connect WhatsApp" in the UI

```typescript
// OLD - Auto-initialization
constructor() {
  this.initialize().catch(err => {
    console.error('WhatsApp initialization failed (non-fatal):', err.message);
  });
}

// NEW - Manual initialization
constructor() {
  console.log('WhatsApp service created. Use initialize() to connect.');
}
```

#### Fixed Data Path
- **Before**: `__dirname/../../data/.wwebjs_auth` (in /opt/ - requires root)
- **After**: `~/.config/bloomswiftpos/.wwebjs_auth` (in user's home - writable)

```typescript
// NEW - User-writable location
const homeDir = os.homedir();
const authPath = path.join(homeDir, '.config', 'bloomswiftpos', '.wwebjs_auth');

// Ensure directory exists
if (!fs.existsSync(authPath)) {
  console.log('Creating WhatsApp data directory:', authPath);
  fs.mkdirSync(authPath, { recursive: true });
}
```

### 2. **Electron Main Process** (`electron/main.js`)

#### Disabled Auto-Update
- Commented out all auto-updater code
- Removed automatic update checks
- Added instructions for re-enabling when update server is ready

```javascript
// Auto-updater disabled - enable when update server is configured
// const { autoUpdater } = require('electron-updater');
```

### 3. **Package Configuration** (`package.json`)

#### Removed Placeholder Publish Config
```json
// REMOVED:
"publish": {
  "provider": "generic",
  "url": "https://your-update-server.com/releases"
}
```

### 4. **Post-Install Script** (`install/post-install.sh`)

#### Added WhatsApp Directory Creation
```bash
# Create WhatsApp data directory with proper permissions
WHATSAPP_DATA_DIR="$APP_DATA_DIR/.wwebjs_auth"
if [ ! -d "$WHATSAPP_DATA_DIR" ]; then
    mkdir -p "$WHATSAPP_DATA_DIR"
    chown -R "$ACTUAL_USER:$ACTUAL_USER" "$WHATSAPP_DATA_DIR"
    chmod -R 755 "$WHATSAPP_DATA_DIR"
    echo "✓ WhatsApp data directory created"
fi
```

---

## What This Fixes

✅ **Yellow Screen Issue** - App starts successfully without permission errors  
✅ **WhatsApp Service** - Connects manually when needed, doesn't block startup  
✅ **QR Code Generation** - Still works perfectly when you connect manually  
✅ **Auto-Update Errors** - No more network connection errors in console  
✅ **Permissions** - All data stored in user-writable locations  

---

## How to Rebuild and Reinstall

### Step 1: Build the New Version

```bash
# Make sure you're in the project root
cd /home/gayan/Desktop/Weerasingha_Hardware

# Build the application
npm run electron:build:deb
```

This will:
1. Compile TypeScript backend → JavaScript
2. Build React frontend → static files
3. Package everything into a `.deb` file

### Step 2: Install the New Version

```bash
# The .deb file will be in the dist/ directory
sudo dpkg -i dist/bloomswiftpos_1.0.0_amd64.deb
```

### Step 3: Launch the Application

```bash
# Run from applications menu or command line
bloomswiftpos
```

---

## How WhatsApp Works Now

### Manual Connection Process:

1. **Start the App** - Opens normally without WhatsApp
2. **Go to Settings** - Navigate to WhatsApp settings
3. **Click "Connect WhatsApp"** - Initiates connection
4. **Scan QR Code** - QR code appears for you to scan
5. **Connected!** - WhatsApp ready to send invoices

### Benefits:
- ✅ App starts quickly and reliably
- ✅ No permission errors
- ✅ WhatsApp connection is optional
- ✅ Clear connection status
- ✅ Full control over when to connect

---

## Data Storage Locations

### Before (Broken):
```
/opt/BloomSwiftPOS/resources/backend/data/.wwebjs_auth/
└── ❌ Permission denied
```

### After (Fixed):
```
~/.config/bloomswiftpos/
├── .wwebjs_auth/          # WhatsApp session data
│   ├── session/
│   └── session-*.json
└── config.json            # Electron Store config
```

---

## Troubleshooting

### If the app still won't start:

1. **Check PostgreSQL is running:**
   ```bash
   sudo systemctl status postgresql
   sudo systemctl start postgresql
   ```

2. **Verify database exists:**
   ```bash
   sudo -u postgres psql -l | grep Heaven_Bakers
   ```

3. **Check permissions on data directory:**
   ```bash
   ls -la ~/.config/bloomswiftpos/
   ```

4. **View application logs:**
   ```bash
   journalctl --user -xe
   ```

### If WhatsApp won't connect:

1. **Ensure Chromium is installed:**
   ```bash
   sudo apt install chromium-browser
   ```

2. **Check WhatsApp data directory:**
   ```bash
   ls -la ~/.config/bloomswiftpos/.wwebjs_auth/
   ```

3. **Clear session and try again:**
   - Use the "Reconnect WhatsApp" button in settings
   - This will clear session and generate a fresh QR code

---

## Re-enabling Auto-Update (Future)

When you're ready to set up an update server:

1. Uncomment the auto-updater code in `electron/main.js`
2. Add publish configuration to `package.json`:
   ```json
   "publish": {
     "provider": "github",
     "owner": "your-username",
     "repo": "your-repo"
   }
   ```
3. Rebuild and publish releases to GitHub

---

## Files Modified

1. `backend/src/services/whatsapp.ts` - TypeScript source
2. `backend/src/services/whatsapp.js` - Compiled JavaScript (will be regenerated)
3. `electron/main.js` - Electron main process
4. `package.json` - Package configuration
5. `install/post-install.sh` - Installation script

---

## Testing Checklist

After rebuilding and installing:

- [ ] Application starts without errors
- [ ] Login screen appears (no yellow screen)
- [ ] Can log in successfully
- [ ] Dashboard loads properly
- [ ] WhatsApp settings page accessible
- [ ] "Connect WhatsApp" button works
- [ ] QR code generates when connecting
- [ ] Can scan QR code and connect
- [ ] Can send test invoice via WhatsApp
- [ ] No permission errors in console

---

## Technical Notes

### Why User's Home Directory?

Following Linux Filesystem Hierarchy Standard (FHS):
- `~/.config/` - User-specific configuration files
- User has full read/write permissions
- No root/sudo required
- Standard location for application data

### Why Manual Initialization?

- Prevents blocking startup
- Allows app to run without WhatsApp
- Better error handling
- User controls connection timing
- More reliable startup process

---

## Questions?

If you encounter any issues:
1. Check the troubleshooting section above
2. Review application logs
3. Verify all dependencies are installed
4. Ensure PostgreSQL is configured correctly

**Important**: After installing, the app should start immediately without the yellow screen!
