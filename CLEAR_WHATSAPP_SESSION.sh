#!/bin/bash

# Clear WhatsApp Session Data Script
# This removes all WhatsApp session data and fixes permission issues

echo "🧹 Clearing WhatsApp Session Data & Fixing Permissions..."
echo "=========================================================="

# Stop any running instances
echo "1️⃣  Stopping any running BloomSwiftPOS processes..."
pkill -f bloomswiftpos 2>/dev/null || true
pkill -f "chrome.*wwebjs" 2>/dev/null || true
pkill -f "node.*backend" 2>/dev/null || true
sleep 2
echo "   ✅ Processes stopped"

# Fix permissions on bloomswiftpos config directory
BLOOMSWIFT_CONFIG="$HOME/.config/bloomswiftpos"
if [ -d "$BLOOMSWIFT_CONFIG" ]; then
    echo ""
    echo "2️⃣  Fixing permissions on bloomswiftpos directory..."
    
    # Check if we need sudo (if directory is owned by root)
    OWNER=$(stat -c '%U' "$BLOOMSWIFT_CONFIG" 2>/dev/null || echo "$USER")
    
    if [ "$OWNER" = "root" ]; then
        echo "   ⚠️  Directory owned by root, using sudo to fix..."
        sudo chown -R $USER:$USER "$BLOOMSWIFT_CONFIG" 2>/dev/null || true
        sudo chmod -R 755 "$BLOOMSWIFT_CONFIG" 2>/dev/null || true
    else
        chmod -R 755 "$BLOOMSWIFT_CONFIG" 2>/dev/null || true
    fi
    echo "   ✅ Permissions fixed"
else
    echo "2️⃣  No config directory found (will be created on startup)"
fi

# Clear WhatsApp session data
echo ""
echo "3️⃣  Removing WhatsApp session data..."
WHATSAPP_AUTH="$HOME/.config/bloomswiftpos/.wwebjs_auth"
if [ -d "$WHATSAPP_AUTH" ]; then
    rm -rf "$WHATSAPP_AUTH" 2>/dev/null || sudo rm -rf "$WHATSAPP_AUTH"
    echo "   ✅ Deleted: $WHATSAPP_AUTH"
else
    echo "   ℹ️  No WhatsApp session data found"
fi

# Optional: Clear Chromium cache (will re-download if needed - ~120MB)
# Uncomment the lines below if you want to also clear Chromium
# echo ""
# echo "4️⃣  Removing Chromium cache..."
# CHROMIUM_DIR="$HOME/.config/bloomswiftpos/chromium"
# if [ -d "$CHROMIUM_DIR" ]; then
#     rm -rf "$CHROMIUM_DIR" 2>/dev/null || sudo rm -rf "$CHROMIUM_DIR"
#     echo "   ✅ Deleted: $CHROMIUM_DIR"
# fi

echo ""
echo "=========================================================="
echo "✅ Cleanup complete!"
echo "=========================================================="
echo ""
echo "📋 Next steps:"
echo "   1. Start BloomSwiftPOS: bloomswiftpos"
echo "   2. Go to Settings"
echo "   3. Click 'Connect WhatsApp'"
echo "   4. Scan the new QR code"
echo ""
echo "⏱️  Expected: Connection completes within 30-60 seconds"
echo ""
