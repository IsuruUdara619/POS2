# BloomSwiftPOS Electron Deployment Guide

This guide covers the complete process of deploying BloomSwiftPOS as an Electron desktop application on Ubuntu 24.04.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Development Setup](#development-setup)
4. [Building for Production](#building-for-production)
5. [Installation](#installation)
6. [Configuration](#configuration)
7. [Troubleshooting](#troubleshooting)

## Overview

BloomSwiftPOS is packaged as a standalone Electron application that includes:
- Embedded Express.js backend server
- React frontend (built with Vite)
- Native desktop integration
- Auto-update support
- Thermal printer support
- PostgreSQL database connectivity

### Architecture

```
BloomSwiftPOS.deb (or AppImage)
├── Electron Main Process
│   ├── Window Management
│   ├── Express Backend Server (Port 5000)
│   └── IPC Communication
├── Electron Renderer Process
│   └── React Frontend Application
└── External Dependencies
    └── PostgreSQL Database (separate installation)
```

## Prerequisites

### For Development

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **PostgreSQL**: v13 or higher
- **Ubuntu**: 24.04 (or 22.04+)
- **Git**: For version control

Install prerequisites:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install build dependencies
sudo apt install -y build-essential libgtk-3-dev libnotify-dev libnss3 \
  libxtst-dev libatspi2.0-dev libdrm-dev libgbm-dev libxcb-dri3-0
```

### For End Users (Installation)

- **Ubuntu**: 24.04 or 22.04+ (or compatible Debian-based distro)
- **PostgreSQL**: v13 or higher
- **4GB RAM** minimum
- **500MB disk space** for application
- **USB permissions** for thermal printer support (handled by post-install script)

## Development Setup

### 1. Clone and Install Dependencies

```bash
cd Heaven_bakers
npm install
```

This will automatically install dependencies for:
- Root project (Electron)
- Backend (Express server)
- Frontend (React/Vite)

### 2. Set Up PostgreSQL Database

```bash
# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres createdb Heaven_Bakers

# Set password (if needed)
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
```

### 3. Configure Environment Variables

Create `.env` files for backend:

**backend/.env**:
```env
PORT=5000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/Heaven_Bakers
JWT_SECRET=your-development-secret-key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### 4. Run in Development Mode

```bash
# From Heaven_bakers directory
npm run electron:dev
```

This command:
1. Starts the backend server on port 5000
2. Starts the Vite dev server on port 5173
3. Launches Electron with hot reload

**Access the application**: It will open automatically in an Electron window with DevTools.

## Building for Production

### Build All Formats (Recommended)

```bash
npm run electron:dist
```

This creates:
- `.deb` package (for apt/dpkg installation)
- `AppImage` (portable executable)

Output location: `Heaven_bakers/dist/`

### Build Specific Format

**Debian Package Only**:
```bash
npm run electron:build:deb
```

**AppImage Only**:
```bash
npm run electron:build:appimage
```

### Build Output

After building, you'll find in `dist/`:
```
dist/
├── BloomSwiftPOS-1.0.0.deb          # Debian package (~150MB)
├── BloomSwiftPOS-1.0.0.AppImage     # Portable executable (~170MB)
├── latest-linux.yml                 # Auto-update metadata
└── builder-debug.yml                # Build debug info
```

## Installation

### Method 1: Debian Package (.deb) - Recommended

```bash
# Install the .deb package
sudo dpkg -i dist/BloomSwiftPOS-1.0.0.deb

# If dependencies are missing, run:
sudo apt --fix-broken install
```

**Post-installation steps** (automatic via post-install script):
- Adds user to `dialout` and `lp` groups for printer access
- Creates udev rules for thermal printers
- Sets up application data directory

**Important**: Log out and log back in after installation for group permissions to take effect.

### Method 2: AppImage - Portable

```bash
# Make executable
chmod +x dist/BloomSwiftPOS-1.0.0.AppImage

# Run directly (no installation needed)
./dist/BloomSwiftPOS-1.0.0.AppImage
```

**Note**: AppImage doesn't run the post-install script. You'll need to manually set up permissions for printer access if needed.

### First-Time Setup

After installation:

1. **Ensure PostgreSQL is running**:
   ```bash
   sudo systemctl status postgresql
   ```

2. **Create the database** (if not already created):
   ```bash
   sudo -u postgres createdb Heaven_Bakers
   ```

3. **Launch BloomSwiftPOS**:
   - From Applications Menu: Look for "BloomSwiftPOS" in Office category
   - From Terminal: `bloomswiftpos` (if .deb installed)

4. **Configure database connection** (first launch):
   - Go to File → Database Settings
   - Enter your PostgreSQL connection details
   - Test connection before saving

## Configuration

### Database Configuration

The application stores database configuration in:
```
~/.config/bloomswiftpos/config.json
```

**Default Connection String**:
```
postgres://postgres:postgres@localhost:5432/Heaven_Bakers
```

**Change via UI**:
1. Open application
2. Go to File → Database Settings
3. Enter new connection details
4. Click "Test Connection"
5. Save if successful
6. Restart application

### Environment Variables (Development)

For development, you can also use environment variables:

```bash
export DATABASE_URL="postgres://user:pass@host:5432/dbname"
export JWT_SECRET="your-secret-key"
export ADMIN_USERNAME="admin"
export ADMIN_PASSWORD="admin123"
```

### Thermal Printer Configuration

The application supports USB and network thermal printers. After installation:

1. Connect your thermal printer via USB
2. Log out and log back in (to apply group permissions)
3. Test printing from the application

**Supported Printers**:
- XP-80C
- Epson thermal printers
- Most ESC/POS compatible printers

## Auto-Update Configuration

### For End Users

Auto-updates check for new versions on startup. When an update is available:
1. Notification appears in the application
2. Click "Download Update"
3. Update downloads in background
4. Click "Install and Restart" when ready

### For Developers/Distributors

To enable auto-updates, you need to host releases on a server. Update `package.json`:

```json
{
  "build": {
    "publish": {
      "provider": "generic",
      "url": "https://your-update-server.com/releases"
    }
  }
}
```

Then upload build artifacts (`*.deb`, `*.AppImage`, `latest-linux.yml`) to your server after each build.

## Troubleshooting

### Application Won't Start

**Issue**: Database connection error on startup

**Solution**:
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL if stopped
sudo systemctl start postgresql

# Verify database exists
sudo -u postgres psql -l | grep Heaven_Bakers
```

### Printer Not Detected

**Issue**: Thermal printer not accessible

**Solution**:
```bash
# Check if user is in required groups
groups $USER | grep -E 'dialout|lp'

# If not, add user to groups
sudo usermod -a -G dialout,lp $USER

# Log out and log back in
```

### Build Fails

**Issue**: Native module build errors

**Solution**:
```bash
# Install build dependencies
sudo apt install -y build-essential libgtk-3-dev libnotify-dev \
  libnss3 libxtst-dev libatspi2.0-dev libdrm-dev libgbm-dev

# Clear node_modules and rebuild
cd Heaven_bakers
rm -rf node_modules backend/node_modules frontend/node_modules
npm install
```

### High Memory Usage

**Issue**: Application using too much RAM

**Solution**:
- Close DevTools if open in production
- Check for memory leaks in backend logs
- Restart the application
- Consider increasing system RAM

### Port 5000 Already in Use

**Issue**: Backend can't start because port is in use

**Solution**:
```bash
# Find what's using port 5000
sudo lsof -i :5000

# Kill the process if safe to do so
sudo kill -9 <PID>

# Or change the port in electron/main.js (BACKEND_PORT)
```

## Development Tips

### Debugging

- **Main Process**: Check terminal output where `npm run electron:dev` was run
- **Renderer Process**: Use DevTools (automatically opens in dev mode)
- **Backend Logs**: Check `backend/backend.log`
- **Database Queries**: Enable PostgreSQL logging

### Hot Reload

In development mode:
- Frontend changes: Auto-reload via Vite HMR
- Backend changes: Restart required (Ctrl+C and re-run `npm run electron:dev`)
- Electron main process: Restart required

### Testing Production Build Locally

```bash
# Build the application
npm run electron:build:deb

# Install locally
sudo dpkg -i dist/BloomSwiftPOS-1.0.0.deb

# Run and test
bloomswiftpos
```

## Security Considerations

- Database credentials are stored encrypted in `electron-store`
- Context isolation is enabled (renderer process can't access Node.js directly)
- No remote code execution allowed
- All IPC communication goes through secure preload script
- JWT tokens are used for API authentication

## Performance Optimization

- Frontend is built with Vite (optimized bundles)
- Code splitting for vendor dependencies
- Backend runs on single thread (suitable for single-store POS)
- Database connection pooling enabled
- Assets cached by Electron

## Uninstallation

**Debian Package**:
```bash
sudo apt remove bloomswiftpos
```

**AppImage**:
```bash
rm BloomSwiftPOS-1.0.0.AppImage
rm -rf ~/.config/bloomswiftpos  # Remove config
```

## Support

For issues or questions:
1. Check this documentation
2. Review logs in `~/.config/bloomswiftpos/`
3. Check backend logs in application directory
4. Consult the troubleshooting section

---

**Version**: 1.0.0  
**Last Updated**: January 2026
