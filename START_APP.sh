#!/bin/bash

# BloomSwiftPOS Startup Script
# This script ensures clean startup by killing any existing processes

echo "🚀 BloomSwiftPOS Startup Script"
echo "================================"

# Kill any existing backend on port 5000
echo "🧹 Cleaning up existing processes..."
lsof -ti:5000 | xargs kill -9 2>/dev/null || true

# Kill any existing Electron processes
pkill -f "electron.*bloomswift" 2>/dev/null || true

# Wait a moment for processes to fully terminate
sleep 2

echo "✅ Cleanup complete"
echo ""
echo "🎬 Starting BloomSwiftPOS..."
echo ""

# Start the Electron app
npm start

echo ""
echo "👋 Application closed"
