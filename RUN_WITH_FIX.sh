#!/bin/bash

echo "🔧 Running BloomSwiftPOS from source with WhatsApp fix..."
echo "=========================================================="

# Kill any running instances
echo "1️⃣  Stopping any running instances..."
pkill -f bloomswiftpos 2>/dev/null || true
pkill -f "chrome.*whatsapp" 2>/dev/null || true
pkill -f "chromium.*whatsapp" 2>/dev/null || true
sleep 2
echo "   ✅ Stopped"

# Clean WhatsApp session
echo ""
echo "2️⃣  Cleaning WhatsApp session..."
rm -rf ~/.config/bloomswiftpos/whatsapp-session 2>/dev/null || true
rm -rf ~/.config/bloomswiftpos/.wwebjs_auth 2>/dev/null || true
echo "   ✅ Cleaned"

echo ""
echo "=========================================================="
echo "✅ Starting application from source with fixes..."
echo "=========================================================="
echo ""

# Start from source
npm start
