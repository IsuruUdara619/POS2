# Building BloomSwiftPOS for Linux - Quick Guide

This is a condensed guide for building BloomSwiftPOS Electron application on Ubuntu 24.04.

## Quick Build Steps

### 1. Install Prerequisites

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install build tools
sudo apt install -y build-essential libgtk-3-dev libnotify-dev libnss3 \
  libxtst-dev libatspi2.0-dev libdrm-dev libgbm-dev libxcb-dri3-0
```

### 2. Install Dependencies

```bash
cd Heaven_bakers
npm install
```

This installs:
- Electron and electron-builder
- All backend dependencies
- All frontend dependencies

### 3. Build Production Package

**Build Everything (Recommended)**:
```bash
npm run electron:dist
```

**Or build specific formats**:
```bash
# .deb only
npm run electron:build:deb

# AppImage only
npm run electron:build:appimage
```

### 4. Find Built Packages

```bash
cd dist/
ls -lh
```

You'll see:
- `BloomSwiftPOS-1.0.0.deb` - Debian package
- `BloomSwiftPOS-1.0.0.AppImage` - Portable executable
- `latest-linux.yml` - Auto-update metadata

## Build Process Explained

When you run `npm run electron:dist`, it:

1. **Compiles Backend** (`npm run build:backend`)
   - Transpiles TypeScript to JavaScript
   - Output: `backend/dist/`

2. **Builds Frontend** (`npm run build:frontend`)
   - Vite builds optimized production bundle
   - Output: `frontend-build/`

3. **Packages with Electron Builder**
   - Bundles Electron + Backend + Frontend
   - Creates .deb and AppImage
   - Output: `dist/`

## Development Mode

To test without building:

```bash
npm run electron:dev
```

This:
- Starts backend on port 5000
- Starts Vite dev server on port 5173
- Opens Electron with DevTools
- Enables hot reload for frontend

## Build Configurations

### Architecture Support

- **x64**: Intel/AMD 64-bit (default)
- **arm64**: ARM 64-bit (like Raspberry Pi 4)

Build for specific architecture:
```bash
# x64 only
electron-builder --linux deb --x64

# arm64 only
electron-builder --linux deb --arm64

# Both
npm run electron:dist
```

### Package Types

**1. Debian Package (.deb)**
- Professional installation
- Integrated with system
- Automatic dependency resolution
- Post-install scripts run automatically
- Desktop menu integration

**2. AppImage**
- Portable, no installation
- Run from anywhere
- No root privileges needed
- Includes all dependencies
- No post-install scripts

## Troubleshooting Build Issues

### Error: "Cannot find module 'electron'"

```bash
rm -rf node_modules package-lock.json
npm install
```

### Error: Native module build failed

```bash
# Install missing build tools
sudo apt install -y build-essential python3

# Rebuild native modules
npm rebuild
```

### Error: "ENOSPC: System limit for number of file watchers reached"

```bash
# Increase file watcher limit
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Error: Permission denied

```bash
# Make sure scripts are executable
chmod +x install/post-install.sh

# Make sure you have write permissions
sudo chown -R $USER:$USER .
```

## Testing the Build

### Test .deb Package

```bash
# Install
sudo dpkg -i dist/BloomSwiftPOS-1.0.0.deb

# Run
bloomswiftpos

# Uninstall when done testing
sudo apt remove bloomswiftpos
```

### Test AppImage

```bash
# Make executable
chmod +x dist/BloomSwiftPOS-1.0.0.AppImage

# Run
./dist/BloomSwiftPOS-1.0.0.AppImage
```

## Build Environment

### Minimum Requirements

- **CPU**: 2 cores
- **RAM**: 4GB (8GB recommended)
- **Disk**: 5GB free space
- **OS**: Ubuntu 24.04, 22.04, or 20.04

### Build Time

Typical build times (on moderate hardware):
- Backend compilation: 10-30 seconds
- Frontend build: 20-60 seconds
- Electron packaging: 30-120 seconds

**Total**: ~2-3 minutes for first build, ~1 minute for subsequent builds (cached)

## Advanced Build Options

### Clean Build

```bash
# Remove all build artifacts
rm -rf dist/ frontend-build/ backend/dist/

# Clean node_modules
rm -rf node_modules backend/node_modules frontend/node_modules

# Reinstall and rebuild
npm install
npm run electron:dist
```

### Build with Custom Icon

Replace `Assets/logo.png` with your icon (512x512 PNG recommended).

### Change App Version

Edit `package.json`:
```json
{
  "version": "1.0.0"
}
```

## Distribution

### Distributing .deb Package

Users install with:
```bash
sudo dpkg -i BloomSwiftPOS-1.0.0.deb
sudo apt --fix-broken install  # If needed
```

### Distributing AppImage

Users run with:
```bash
chmod +x BloomSwiftPOS-1.0.0.AppImage
./BloomSwiftPOS-1.0.0.AppImage
```

### File Sizes

Expected package sizes:
- **.deb**: ~140-160 MB
- **AppImage**: ~160-180 MB

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build Electron App
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run electron:dist
      - uses: actions/upload-artifact@v2
        with:
          name: linux-packages
          path: dist/*.{deb,AppImage}
```

## Next Steps

After building:

1. **Test the package** on a clean Ubuntu 24.04 system
2. **Document any system requirements** specific to your setup
3. **Set up auto-update server** (optional, see ELECTRON_DEPLOYMENT.md)
4. **Create installation guide** for end users

## Resources

- [Electron Builder Docs](https://www.electron.build/)
- [Electron Documentation](https://www.electronjs.org/docs)
- [Ubuntu Packaging Guide](https://packaging.ubuntu.com/html/)

---

**Version**: 1.0.0  
**Last Updated**: January 2026
