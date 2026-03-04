# Quick Start Guide - After WhatsApp Fix

## Starting the Application

### Method 1: Using the Startup Script (Recommended)

```bash
./START_APP.sh
```

This script automatically:
- Cleans up any existing processes on port 5000
- Kills previous Electron instances
- Starts the app cleanly

### Method 2: Manual Start

```bash
# 1. Clean up existing processes
lsof -ti:5000 | xargs kill -9 2>/dev/null

# 2. Wait a moment
sleep 2

# 3. Start the app
npm start
```

## Common Issues & Solutions

### Issue: "Port 5000 already in use"

**Solution:**
```bash
# Kill the process using port 5000
lsof -ti:5000 | xargs kill -9

# Then restart
npm start
```

### Issue: Application won't start after code changes

**Solution:**
```bash
# Full cleanup and restart
pkill -f electron
lsof -ti:5000 | xargs kill -9
npm start
```

### Issue: WhatsApp connection fails

**First time:**
- WhatsApp will download Chromium (~150MB)
- This takes 2-5 minutes
- Be patient!

**If stuck:**
1. Use "Reconnect" button in UI
2. Or restart the app: `./START_APP.sh`

## Development Mode

If running in development with Vite:

```bash
# Terminal 1: Start Vite dev server
cd frontend
npm run dev

# Terminal 2: Start backend
cd backend
npm start

# Terminal 3: Start Electron (from root)
npm start
```

## What Changed?

The WhatsApp integration now:
- ✅ Downloads its own Chromium (isolated from Electron)
- ✅ Cleans up processes/locks automatically
- ✅ Handles errors gracefully
- ✅ Works reliably in Electron

## First WhatsApp Connection

1. **Start app:** `./START_APP.sh`
2. **Go to WhatsApp page** in the app
3. **Click "Connect WhatsApp"**
4. **Wait for Chromium download** (first time only, 2-5 min)
5. **Scan QR code** with your phone
6. **Done!** Send invoices via WhatsApp

## Logs

Check logs if something goes wrong:
```bash
# View recent logs
tail -f logs/*.log

# Or check the logs folder
cd logs
ls -lh
```

## Need Help?

1. Check `docs/WHATSAPP_ELECTRON_FIX.md` for detailed documentation
2. Look at logs in `logs/` directory
3. Try the manual cleanup commands above
4. Remove `~/.config/bloomswiftpos/chromium` if Chromium download is stuck

## Status Check

After starting, you should see:
1. ✅ Backend starts on port 5000
2. ✅ Electron window opens
3. ✅ Login page loads
4. ✅ No errors in console

If any step fails, check the logs!
