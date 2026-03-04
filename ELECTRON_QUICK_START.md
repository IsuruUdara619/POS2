# BloomSwiftPOS Electron - Quick Start Guide

## 🚀 Build Your First Electron Package (5 Minutes)

### Step 1: Verify Prerequisites

```bash
# Check Node.js version (should be 18+)
node --version

# Check npm version
npm --version

# Check if PostgreSQL is installed
psql --version
```

If missing, install:
```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib
```

### Step 2: Set Up Database

```bash
# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres createdb Heaven_Bakers

# Set postgres user password (optional)
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
```

### Step 3: Configure Backend

Create `backend/.env` file:
```bash
cd Heaven_bakers/backend
cat > .env << 'EOF'
PORT=5000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/Heaven_Bakers
JWT_SECRET=your-development-secret-key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
EOF
cd ..
```

### Step 4: Build the Application

```bash
# From Heaven_bakers directory
npm run electron:dist
```

This will:
- ✅ Compile TypeScript backend
- ✅ Build React frontend with Vite
- ✅ Package everything into Electron app
- ✅ Create .deb and AppImage files

**Build time**: ~2-3 minutes on first run

### Step 5: Test the Build

After build completes, find your packages:

```bash
cd dist/
ls -lh
```

You should see:
- `BloomSwiftPOS-1.0.0.deb` - Debian package
- `BloomSwiftPOS-1.0.0.AppImage` - Portable executable
- `latest-linux.yml` - Auto-update metadata

### Step 6: Install and Run

**Option A: Install .deb package**
```bash
sudo dpkg -i BloomSwiftPOS-1.0.0.deb
sudo apt --fix-broken install  # If needed

# Log out and log back in (for printer permissions)
# Then launch:
bloomswiftpos
```

**Option B: Run AppImage directly**
```bash
chmod +x BloomSwiftPOS-1.0.0.AppImage
./BloomSwiftPOS-1.0.0.AppImage
```

### Step 7: Login

Default credentials:
- **Username**: `admin`
- **Password**: `admin123`

## 🛠️ Development Mode (Optional)

To run in development mode with hot reload:

```bash
# Make sure PostgreSQL is running
sudo systemctl status postgresql

# Run development mode
npm run electron:dev
```

This opens the app with DevTools enabled and allows you to make changes with hot reload.

## 📝 Common Commands

```bash
# Development mode
npm run electron:dev

# Build all formats
npm run electron:dist

# Build .deb only
npm run electron:build:deb

# Build AppImage only
npm run electron:build:appimage

# Clean build (if issues occur)
rm -rf dist/ frontend-build/ backend/dist/
npm run electron:dist
```

## 🐛 Troubleshooting Quick Fixes

### "Cannot find module 'electron'"
```bash
rm -rf node_modules package-lock.json
npm install
```

### "Database connection failed"
```bash
# Start PostgreSQL
sudo systemctl start postgresql

# Verify database exists
sudo -u postgres psql -l | grep Heaven_Bakers

# Create if missing
sudo -u postgres createdb Heaven_Bakers
```

### "Port 5000 already in use"
```bash
# Find what's using it
sudo lsof -i :5000

# Kill the process
sudo kill -9 <PID>
```

### Build fails with native module errors
```bash
# Install build dependencies
sudo apt install -y build-essential libgtk-3-dev libnotify-dev \
  libnss3 libxtst-dev libatspi2.0-dev libdrm-dev libgbm-dev

# Rebuild
npm rebuild
```

## 📦 Distribution Checklist

Before distributing to users:

- [ ] Test installation on clean Ubuntu 24.04 system
- [ ] Verify database connection setup
- [ ] Test thermal printer functionality (if applicable)
- [ ] Verify all features work (sales, inventory, reports, etc.)
- [ ] Document any system-specific requirements
- [ ] Provide installation instructions
- [ ] Set up update server (optional, for auto-updates)

## 🎯 Next Steps

1. **Test thoroughly** on your system
2. **Configure database** with your production settings
3. **Customize branding** (if needed)
4. **Set up auto-updates** (see ELECTRON_DEPLOYMENT.md)
5. **Create user documentation**

## 📚 Additional Resources

- [ELECTRON_DEPLOYMENT.md](docs/ELECTRON_DEPLOYMENT.md) - Complete deployment guide
- [BUILDING_FOR_LINUX.md](docs/BUILDING_FOR_LINUX.md) - Detailed build instructions
- [README.md](README.md) - Application features and documentation

## ⚡ Pro Tips

1. **First build is slowest**: Subsequent builds are much faster (cached dependencies)
2. **Use development mode**: Makes testing changes much faster
3. **Clean build if issues**: Remove dist/ and frontend-build/ folders
4. **Check logs**: Look in `~/.config/bloomswiftpos/` for app logs
5. **Database backups**: Always backup your database before updates

---

**Ready to build?** Run `npm run electron:dist` and you'll have your packages in ~3 minutes! 🚀
