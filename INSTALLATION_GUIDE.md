# BloomSwiftPOS - Installation & Launch Guide

## ✅ Build Complete!

Your BloomSwiftPOS Electron application has been successfully built with proper desktop icon integration!

## 📦 Built Packages

Located in the `dist/` folder:

1. **bloomswiftpos_1.0.0_amd64.deb** (233 MB)
   - Debian/Ubuntu package with full system integration
   - Automatic desktop menu entry with icon
   - Includes post-install scripts for permissions

2. **BloomSwiftPOS-1.0.0.AppImage** (340 MB)
   - Portable executable (no installation required)
   - Run from anywhere
   - Self-contained with all dependencies

## 🚀 Installation Methods

### Method 1: Install .deb Package (Recommended)

#### Step 1: Install the Package
```bash
cd /home/gayan/Desktop/Weerasingha_Hardware
sudo dpkg -i dist/bloomswiftpos_1.0.0_amd64.deb
```

If you get dependency errors, run:
```bash
sudo apt --fix-broken install
```

#### Step 2: Launch the Application

**Option A: From Application Menu**
1. Press Super/Windows key
2. Type "BloomSwiftPOS"
3. Click the icon to launch

**Option B: From Terminal**
```bash
bloomswiftpos
```

**Option C: Create Desktop Shortcut**
```bash
cp /usr/share/applications/bloomswiftpos.desktop ~/Desktop/
chmod +x ~/Desktop/bloomswiftpos.desktop
```
Then double-click the desktop icon to launch!

#### Step 3: Log Out and Back In (Important!)
For USB/printer permissions to take effect:
```bash
# Log out and log back in, or run:
su - $USER
```

---

### Method 2: Run AppImage (Portable)

#### Step 1: Make Executable
```bash
cd /home/gayan/Desktop/Weerasingha_Hardware
chmod +x dist/BloomSwiftPOS-1.0.0.AppImage
```

#### Step 2: Run the Application
```bash
./dist/BloomSwiftPOS-1.0.0.AppImage
```

**Create Desktop Shortcut for AppImage:**
```bash
# Copy to a permanent location
mkdir -p ~/.local/bin
cp dist/BloomSwiftPOS-1.0.0.AppImage ~/.local/bin/

# Create desktop entry
cat > ~/.local/share/applications/bloomswiftpos-portable.desktop << 'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=BloomSwiftPOS (Portable)
Comment=Point of Sale System - Portable Version
Exec=/home/$USER/.local/bin/BloomSwiftPOS-1.0.0.AppImage
Icon=bloomswiftpos
Terminal=false
Categories=Office;Finance;
Keywords=pos;sales;inventory;retail;
StartupNotify=true
EOF

# Update desktop database
update-desktop-database ~/.local/share/applications
```

---

## 🎯 Desktop Icon Features

Your BloomSwiftPOS application now has:

✅ **Application Menu Icon** - Find it in your system application menu under "Office"
✅ **Desktop Shortcut** - Create a clickable desktop icon (see instructions above)
✅ **Taskbar Icon** - Shows the BloomSwiftPOS logo when running
✅ **Proper Icon Resolution** - Uses high-quality 512x512 PNG icon
✅ **System Integration** - Integrated with Ubuntu/Linux desktop environment

---

## 🗑️ Uninstallation

### Remove .deb Package:
```bash
sudo apt remove bloomswiftpos
```

### Remove AppImage:
```bash
rm ~/.local/bin/BloomSwiftPOS-1.0.0.AppImage
rm ~/.local/share/applications/bloomswiftpos-portable.desktop
```

---

## 🔧 Prerequisites

Before first launch, ensure:

1. **PostgreSQL is installed and running:**
   ```bash
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

2. **Database is created:**
   ```bash
   # Create database
   sudo -u postgres createdb Heaven_Bakers
   
   # Set password (if needed)
   sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
   ```

3. **Default database connection:**
   - Host: localhost
   - Port: 5432
   - Database: Heaven_Bakers
   - Username: postgres
   - Password: postgres

   You can change these in the app: **File → Database Settings**

---

## 🖥️ System Requirements

### Minimum:
- Ubuntu 20.04+ (or compatible Debian-based distro)
- 4GB RAM
- 500MB disk space
- PostgreSQL 13+

### Recommended:
- Ubuntu 24.04 LTS
- 8GB RAM
- 1GB disk space
- PostgreSQL 15+

---

## 🐛 Troubleshooting

### Issue: Icon doesn't appear in menu
**Solution:**
```bash
# Update desktop database
sudo update-desktop-database
# Or for user-level:
update-desktop-database ~/.local/share/applications
```

### Issue: "Cannot connect to database"
**Solution:**
1. Check PostgreSQL is running: `sudo systemctl status postgresql`
2. Create database: `sudo -u postgres createdb Heaven_Bakers`
3. Configure in app: File → Database Settings

### Issue: Permission denied for printers
**Solution:**
```bash
sudo usermod -a -G dialout,lp $USER
# Log out and log back in
```

### Issue: Application won't start
**Solution:**
Check logs:
```bash
# View application logs
cat ~/.config/bloomswiftpos/logs/main.log

# Check system logs
journalctl -xe | grep bloomswift
```

### Issue: Desktop icon says "Untrusted Application"
**Solution:**
```bash
# Right-click the desktop icon
# Select "Allow Launching"
# Or run:
chmod +x ~/Desktop/bloomswiftpos.desktop
```

---

## 📋 What Happens When You Click the Icon?

1. **Electron Window Opens** - Native desktop application window
2. **Backend Server Starts** - Express server on port 5000
3. **Frontend Loads** - React app loads in the Electron window
4. **Database Connects** - Connects to PostgreSQL
5. **Ready to Use** - Login screen appears

---

## 🎨 Icon Information

- **Icon File**: Assets/logo-512.png (512x512 PNG)
- **System Location** (after .deb install): `/usr/share/icons/hicolor/0x0/apps/bloomswiftpos.png`
- **Desktop Entry**: `/usr/share/applications/bloomswiftpos.desktop`
- **Executable**: `/opt/BloomSwiftPOS/bloomswiftpos`

---

## 📦 Distribution

To distribute your application to other users:

1. **Share the .deb file** for easy installation
2. **Share the AppImage** for portable use
3. **Include this guide** for installation instructions

Users can download and install without needing to build from source!

---

## 🔄 Updating the Application

To rebuild after making changes:

```bash
cd /home/gayan/Desktop/Weerasingha_Hardware
npm run electron:dist
```

This will create new packages in the `dist/` folder.

---

## ✨ Success!

Your BloomSwiftPOS application is now ready to use! The desktop icon will launch the application every time you click it.

**Quick Launch:**
1. Press Super/Windows key
2. Type "Bloom"
3. Press Enter

**That's it! Enjoy your Point of Sale system! 🎉**

---

## 📞 Need Help?

- Check logs: `~/.config/bloomswiftpos/logs/`
- View documentation: See docs/ folder in project
- Review build output: `dist/builder-debug.yml`

---

**Build Date**: January 27, 2026  
**Version**: 1.0.0  
**Platform**: Linux (Ubuntu 24.04)  
**Package Size**: 233 MB (.deb) / 340 MB (AppImage)
