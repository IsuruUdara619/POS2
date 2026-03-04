# Production Rebuild Guide

## Problem: Receipt Changes Not Reflecting in Production

If you've made changes to the receipt printer code (e.g., `backend/src/utils/escposPrinter.ts`) but they're not showing up when you print receipts, this guide will help you resolve the issue.

### Root Cause

The application runs on **compiled JavaScript** files in production, not the TypeScript source files. When you edit the `.ts` files, you must **rebuild** the application to compile those changes into `.js` files.

Even if you run `npm run build:backend` or `npm run build:frontend`, changes may not be reflected due to:
- **Module caching** by Node.js/Electron
- **Stale compiled files** not being replaced
- **Application not being restarted** after rebuild

---

## Solution: Complete Clean Rebuild

### Quick Method (Recommended)

We've created a helper script that does everything automatically:

```bash
./CLEAN_REBUILD.sh
```

This script will:
1. ✅ Remove old compiled files
2. ✅ Rebuild backend (compile TypeScript)
3. ✅ Rebuild frontend
4. ✅ Verify the build was successful

### Manual Method (Step-by-Step)

If you prefer to do it manually:

#### Step 1: Clean Backend Dist Folder
```bash
rm -rf backend/dist
```

#### Step 2: Rebuild Backend
```bash
npm run build:backend
```

#### Step 3: Rebuild Frontend
```bash
npm run build:frontend
```

#### Step 4: Verify Changes
Check that the compiled file has the latest timestamp:
```bash
ls -lh backend/dist/src/utils/escposPrinter.js
```

You can also grep for specific changes you made:
```bash
grep "your specific change" backend/dist/src/utils/escposPrinter.js
```

---

## Restarting the Application

After rebuilding, you **MUST restart** the application for changes to take effect:

### If Running from Source
1. **Stop** the current application (Ctrl+C in terminal or close the window)
2. **Start** it again:
   ```bash
   ./START_APP.sh
   ```
   Or:
   ```bash
   npm start
   ```

### If Running Installed Application
1. **Close** BloomSwiftPOS completely
2. **Reopen** it from your application menu or desktop shortcut

### If Running as a Service/Background Process
1. Find and kill any existing processes:
   ```bash
   pkill -f "electron.*bloomswift" || true
   pkill -f "node.*backend" || true
   ```
2. Restart the application

---

## Verification Checklist

After restarting, verify your changes are working:

- [ ] Application starts without errors
- [ ] Print a test receipt
- [ ] Check that your specific changes appear on the printed receipt
- [ ] Verify timestamp shows current date/time
- [ ] Confirm all formatting changes are present

---

## Common Issues & Solutions

### Issue: Changes still not showing after rebuild

**Solution:**
1. Make sure you **completely closed** the application (not just minimized)
2. Check if there are any background Electron/Node processes still running:
   ```bash
   ps aux | grep -E "(electron|node.*backend)"
   ```
3. Kill any lingering processes:
   ```bash
   killall electron
   killall node
   ```
4. Restart the application

### Issue: Build fails with TypeScript errors

**Solution:**
1. Check the error message - it will point to the line with the issue
2. Fix syntax errors in your TypeScript files
3. Make sure all imports are correct
4. Run `npm run build:backend` again

### Issue: Printer not responding at all

**Solution:**
This is a different issue from changes not reflecting. Check:
1. Printer is connected and powered on
2. Printer path is correct in settings
3. Check printer logs: `backend/logs/`

---

## For Future Development

### Best Practice: Always Clean Rebuild

Whenever you make changes to backend code (especially printer-related code), always:

1. **Edit** the source TypeScript file (`.ts`)
2. **Run** `./CLEAN_REBUILD.sh` (or manual rebuild steps)
3. **Restart** the application completely
4. **Test** your changes with a real print

### Development vs Production

- **Development Mode**: Uses `ts-node` to run TypeScript directly (faster iteration)
- **Production Mode**: Uses compiled JavaScript from `backend/dist/` (what you're running)

If you're actively developing:
```bash
npm run electron:dev
```
This watches for changes and recompiles automatically.

If you're running production builds:
```bash
npm start
# or
./START_APP.sh
```
This requires manual rebuilds when you change code.

---

## Files Modified in Latest Receipt Changes

The receipt printer changes you made affected:
- `backend/src/utils/escposPrinter.ts` (source file)
- `backend/dist/src/utils/escposPrinter.js` (compiled file - this is what runs)

Key changes included:
- ✅ Added system timestamp with full date and time
- ✅ Added "Exchanges are possible within 7 days" footer
- ✅ Inverted header row for items table (black background, white text)
- ✅ Various formatting improvements

All these changes have been successfully compiled and are ready to use after restart!

---

## Quick Reference Commands

| Task | Command |
|------|---------|
| Clean rebuild everything | `./CLEAN_REBUILD.sh` |
| Rebuild backend only | `npm run build:backend` |
| Rebuild frontend only | `npm run build:frontend` |
| Start from source | `./START_APP.sh` or `npm start` |
| Check compiled file timestamp | `ls -lh backend/dist/src/utils/escposPrinter.js` |
| Find running processes | `ps aux \| grep -E "(electron\|node.*backend)"` |
| Kill all processes | `killall electron && killall node` |

---

## Need Help?

If you're still having issues after following this guide:
1. Check application logs in `backend/logs/`
2. Check Electron logs in `logs/`
3. Try running in development mode to see detailed error messages
4. Ensure all dependencies are installed: `npm install`

---

*Last Updated: February 5, 2026*
