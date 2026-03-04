# BloomSwiftPOS - Electron Desktop Application

**A comprehensive Point of Sale system packaged as a native Linux desktop application.**

## 🚀 Quick Start for Users

### Installation

1. **Download** the latest release:
   - `.deb` package (recommended for Ubuntu/Debian)
   - `AppImage` (portable, works on most Linux distributions)

2. **Install PostgreSQL** (if not already installed):
   ```bash
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   sudo -u postgres createdb Heaven_Bakers
   ```

3. **Install BloomSwiftPOS**:
   ```bash
   # For .deb package
   sudo dpkg -i BloomSwiftPOS-1.0.0.deb
   sudo apt --fix-broken install  # If needed
   
   # For AppImage
   chmod +x BloomSwiftPOS-1.0.0.AppImage
   ./BloomSwiftPOS-1.0.0.AppImage
   ```

4. **Launch the application**:
   - Find "BloomSwiftPOS" in your applications menu (Office category)
   - Or run `bloomswiftpos` from terminal

5. **Important**: After installation, log out and log back in to enable printer permissions.

## 🛠️ For Developers

### Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL 13+
- Ubuntu 24.04 (or 22.04+)
- Build tools: `build-essential`, `libgtk-3-dev`, etc.

### Development Setup

```bash
# 1. Install dependencies
cd Heaven_bakers
npm install

# 2. Set up database
sudo systemctl start postgresql
sudo -u postgres createdb Heaven_Bakers

# 3. Configure backend (create backend/.env)
# See backend/.env.example

# 4. Run in development mode
npm run electron:dev
```

### Building for Production

```bash
# Build all formats (.deb + AppImage)
npm run electron:dist

# Or build specific format
npm run electron:build:deb
npm run electron:build:appimage
```

Output will be in `dist/` directory.

## 📦 What's Included

- **Electron Application**: Native Linux desktop app
- **Express Backend**: Embedded Node.js API server
- **React Frontend**: Modern, responsive UI
- **Auto-Update Support**: Automatic update notifications
- **Thermal Printer Support**: USB/Network printer integration
- **Database Management**: PostgreSQL connectivity

## 🎯 Features

- ✅ Sales Management & Invoicing
- ✅ Inventory Control & Stock Management
- ✅ Purchase Orders & Vendor Management
- ✅ Customer Loyalty Program
- ✅ Expense Tracking
- ✅ Comprehensive Reporting (PDF/Excel)
- ✅ Barcode Generation & Scanning
- ✅ Receipt Printing (Thermal Printers)
- ✅ User Management & RBAC
- ✅ WhatsApp Integration (Optional)

## 📚 Documentation

- **[ELECTRON_DEPLOYMENT.md](docs/ELECTRON_DEPLOYMENT.md)** - Complete deployment guide
- **[BUILDING_FOR_LINUX.md](docs/BUILDING_FOR_LINUX.md)** - Build instructions
- **[README.md](README.md)** - General project documentation

## 🔧 Configuration

### Database Connection

Configure via the application:
1. Open BloomSwiftPOS
2. Go to **File → Database Settings**
3. Enter connection details
4. Test and save

Default connection: `postgres://postgres:postgres@localhost:5432/Heaven_Bakers`

### Thermal Printer Setup

1. Connect USB printer
2. Log out and log back in (for permissions)
3. Configure printer in application settings

## 🐛 Troubleshooting

### Application won't start
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql
sudo systemctl start postgresql
```

### Printer not detected
```bash
# Check user groups
groups $USER | grep -E 'dialout|lp'

# Add to groups if missing
sudo usermod -a -G dialout,lp $USER
# Then log out and back in
```

### Port 5000 in use
```bash
# Find what's using the port
sudo lsof -i :5000
# Kill if safe, or change port in electron/main.js
```

## 📊 System Requirements

### Minimum
- **OS**: Ubuntu 24.04, 22.04, or compatible Linux
- **CPU**: Dual-core processor
- **RAM**: 4GB
- **Disk**: 500MB for application + PostgreSQL
- **Database**: PostgreSQL 13+

### Recommended
- **RAM**: 8GB
- **Disk**: 1GB+ free space
- **SSD** for better database performance

## 🔒 Security

- Database credentials stored encrypted
- Context isolation enabled
- JWT-based authentication
- Secure IPC communication
- No remote code execution

## 📄 License

Proprietary - All rights reserved.

## 🆘 Support

For issues or questions:
1. Check documentation in `docs/` folder
2. Review logs in `~/.config/bloomswiftpos/`
3. Check backend logs in application directory

---

**Version**: 1.0.0  
**Application Name**: BloomSwiftPOS  
**Platform**: Linux (Ubuntu 24.04)  
**Last Updated**: January 2026

## Default Login

- **Username**: admin
- **Password**: admin123

⚠️ **Change default credentials after first login!**
