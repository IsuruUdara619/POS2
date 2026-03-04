# 🚀 Run BloomSwiftPOS from Source

This runs the Electron app from source code (avoiding permission issues from the packaged version).

## ✅ **Quick Start**

```bash
# 1. Stop the installed app
pkill -f bloomswiftpos

# 2. Navigate to project directory
cd /home/gayan/Desktop/Weerasingha_Hardware

# 3. Clear WhatsApp session (fixes permissions)
./CLEAR_WHATSAPP_SESSION.sh

# 4. Run from source
npm start
```

That's it! The app will open with **YOUR user permissions** (no permission errors).

---

## 📋 **What Happens**

When you run `npm start`:
1. **Backend starts** on port 5000 (from `backend/` directory)
2. **Electron window opens** (still uses Electron!)
3. **Runs with your permissions** (no `/opt/` restrictions)

---

## ✅ **Advantages**

- ✅ No permission issues
- ✅ Still uses Electron
- ✅ Easier to debug
- ✅ No need to rebuild .deb after code changes
- ✅ WhatsApp works properly

---

## 🔄 **Development Workflow**

### **Daily Use:**
```bash
cd /home/gayan/Desktop/Weerasingha_Hardware
npm start
```

### **After Code Changes:**
```bash
# Backend changes require rebuild
npm run build:backend
npm start

# OR just restart npm start (it uses ts-node)
```

### **Frontend changes (development mode):**
```bash
# Terminal 1: Backend + Electron with built frontend
npm start

# Terminal 2: Frontend dev server (hot reload)
npm run start:frontend
# Then navigate to http://localhost:5173 in the Electron window
```

---

## 🐛 **Troubleshooting**

### **Port 5000 in use**
```bash
# Kill existing backend
pkill -f "node.*backend"

# Or kill all
pkill -f bloomswiftpos
```

### **WhatsApp still has permission errors**
```bash
# Full cleanup
./CLEAR_WHATSAPP_SESSION.sh

# Ensure permissions
chmod -R 755 ~/.config/bloomswiftpos
```

### **Electron won't start**
```bash
# Check if dependencies are installed
npm install

# Check if backend builds
cd backend && npm install && cd ..

# Try again
npm start
```

---

## 📦 **vs Packaged Version**

| Feature | Source (`npm start`) | Package (`bloomswiftpos`) |
|---------|---------------------|---------------------------|
| Uses Electron | ✅ Yes | ✅ Yes |
| Permissions | Your user | System restricted |
| WhatsApp Works | ✅ Yes | ❌ Permission errors |
| For Development | ✅ Perfect | ❌ Not ideal |
| For Distribution | ❌ No | ✅ Yes |
| Code Changes | Instant | Must rebuild .deb |

---

## 🎯 **Recommended Setup**

**Development (You):**
```bash
npm start  # Run from source
```

**Production (End Users):**
```bash
bloomswiftpos  # Use .deb package (after fixing permissions in build)
```

---

**Status:** Ready to run from source!  
**Date:** February 2, 2026
