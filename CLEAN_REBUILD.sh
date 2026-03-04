#!/bin/bash

# Clean Rebuild Script for BloomSwiftPOS Production
# This script performs a complete clean rebuild of the application
# Use this when source code changes are not being reflected in production

set -e  # Exit on error

echo "======================================"
echo "BloomSwiftPOS Clean Rebuild"
echo "======================================"
echo ""

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "📁 Working directory: $SCRIPT_DIR"
echo ""

# Step 1: Clean backend dist folder
echo "🧹 Step 1: Cleaning backend dist folder..."
if [ -d "backend/dist" ]; then
    rm -rf backend/dist
    echo "   ✅ Backend dist folder removed"
else
    echo "   ℹ️  Backend dist folder doesn't exist (already clean)"
fi
echo ""

# Step 2: Rebuild backend (TypeScript compilation)
echo "🔨 Step 2: Rebuilding backend (compiling TypeScript)..."
npm run build:backend
echo "   ✅ Backend compiled successfully"
echo ""

# Step 3: Rebuild frontend
echo "🔨 Step 3: Rebuilding frontend..."
npm run build:frontend
echo "   ✅ Frontend built successfully"
echo ""

# Step 4: Verify critical files
echo "🔍 Step 4: Verifying build output..."
if [ -f "backend/dist/index.js" ]; then
    echo "   ✅ Backend entry point exists"
else
    echo "   ❌ Backend entry point missing!"
    exit 1
fi

if [ -f "backend/dist/src/utils/escposPrinter.js" ]; then
    PRINTER_MOD_TIME=$(stat -c %y "backend/dist/src/utils/escposPrinter.js" 2>/dev/null || stat -f %Sm "backend/dist/src/utils/escposPrinter.js" 2>/dev/null)
    echo "   ✅ Printer utility exists (modified: $PRINTER_MOD_TIME)"
else
    echo "   ❌ Printer utility missing!"
    exit 1
fi

if [ -d "frontend-build" ] && [ -f "frontend-build/index.html" ]; then
    echo "   ✅ Frontend build exists"
else
    echo "   ❌ Frontend build missing!"
    exit 1
fi
echo ""

echo "======================================"
echo "✅ Clean rebuild completed successfully!"
echo "======================================"
echo ""
echo "📌 Next steps:"
echo "   1. Close the BloomSwiftPOS application if it's running"
echo "   2. Restart the application using one of these methods:"
echo "      - If installed: Launch from application menu"
echo "      - If running from source: ./START_APP.sh"
echo "      - If using npm: npm start"
echo ""
echo "💡 The receipt printer changes should now be reflected!"
echo ""
