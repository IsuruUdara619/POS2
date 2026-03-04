#!/bin/bash
# BloomSwiftPOS Post-Installation Script
# This script sets up necessary permissions for USB devices and printers

set -e

echo "=========================================="
echo "BloomSwiftPOS Post-Installation Setup"
echo "=========================================="

# Get the actual user who invoked sudo (if applicable)
if [ -n "$SUDO_USER" ]; then
    ACTUAL_USER="$SUDO_USER"
else
    ACTUAL_USER="$USER"
fi

echo "Setting up for user: $ACTUAL_USER"

# Add user to dialout group for USB/serial device access
if groups "$ACTUAL_USER" | grep -q '\bdialout\b'; then
    echo "✓ User already in dialout group"
else
    echo "Adding user to dialout group for USB device access..."
    usermod -a -G dialout "$ACTUAL_USER"
    echo "✓ User added to dialout group"
fi

# Add user to lp group for printer access
if groups "$ACTUAL_USER" | grep -q '\blp\b'; then
    echo "✓ User already in lp group"
else
    echo "Adding user to lp group for printer access..."
    usermod -a -G lp "$ACTUAL_USER"
    echo "✓ User added to lp group"
fi

# Create udev rules for thermal printers if they don't exist
UDEV_RULES_FILE="/etc/udev/rules.d/99-bloomswift-printers.rules"
if [ ! -f "$UDEV_RULES_FILE" ]; then
    echo "Creating udev rules for thermal printers..."
    cat > "$UDEV_RULES_FILE" << 'EOF'
# BloomSwiftPOS Thermal Printer Rules
# XP-80C and similar thermal printers
SUBSYSTEM=="usb", ATTRS{idVendor}=="0519", ATTRS{idProduct}=="0001", MODE="0666", GROUP="lp"
SUBSYSTEM=="usb", ATTRS{idVendor}=="04b8", MODE="0666", GROUP="lp"
# Generic USB printers
SUBSYSTEM=="usb", ATTR{bInterfaceClass}=="07", ATTR{bInterfaceSubClass}=="01", MODE="0666", GROUP="lp"
EOF
    echo "✓ Udev rules created"
    
    # Reload udev rules
    echo "Reloading udev rules..."
    udevadm control --reload-rules
    udevadm trigger
    echo "✓ Udev rules reloaded"
else
    echo "✓ Udev rules already exist"
fi

# Create application data directory if it doesn't exist
APP_DATA_DIR="/home/$ACTUAL_USER/.config/bloomswiftpos"
if [ ! -d "$APP_DATA_DIR" ]; then
    mkdir -p "$APP_DATA_DIR"
    chown -R "$ACTUAL_USER:$ACTUAL_USER" "$APP_DATA_DIR"
    chmod -R 755 "$APP_DATA_DIR"
    echo "✓ Application data directory created"
else
    # Always ensure proper permissions on existing directory
    chown -R "$ACTUAL_USER:$ACTUAL_USER" "$APP_DATA_DIR"
    chmod -R 755 "$APP_DATA_DIR"
    echo "✓ Application data directory permissions updated"
fi

# Create WhatsApp data directory with proper permissions
WHATSAPP_DATA_DIR="$APP_DATA_DIR/.wwebjs_auth"
if [ ! -d "$WHATSAPP_DATA_DIR" ]; then
    mkdir -p "$WHATSAPP_DATA_DIR"
    chown -R "$ACTUAL_USER:$ACTUAL_USER" "$WHATSAPP_DATA_DIR"
    chmod -R 755 "$WHATSAPP_DATA_DIR"
    echo "✓ WhatsApp data directory created"
else
    # Ensure proper permissions if directory exists
    chown -R "$ACTUAL_USER:$ACTUAL_USER" "$WHATSAPP_DATA_DIR"
    chmod -R 755 "$WHATSAPP_DATA_DIR"
    echo "✓ WhatsApp data directory permissions updated"
fi

# Fix any permission issues on subdirectories that might have been created
if [ -d "$WHATSAPP_DATA_DIR/session" ]; then
    chown -R "$ACTUAL_USER:$ACTUAL_USER" "$WHATSAPP_DATA_DIR/session"
    chmod -R 755 "$WHATSAPP_DATA_DIR/session"
    echo "✓ WhatsApp session directory permissions fixed"
fi

# Fix chrome-sandbox permissions for Electron
echo "Configuring Electron chrome-sandbox..."
if [ -f "/opt/BloomSwiftPOS/chrome-sandbox" ]; then
    chown root:root /opt/BloomSwiftPOS/chrome-sandbox
    chmod 4755 /opt/BloomSwiftPOS/chrome-sandbox
    echo "✓ Chrome sandbox permissions configured (root:root, mode 4755)"
else
    echo "⚠ Warning: chrome-sandbox not found at /opt/BloomSwiftPOS/chrome-sandbox"
fi

echo ""
echo "=========================================="
echo "Installation Complete!"
echo "=========================================="
echo ""
echo "IMPORTANT NEXT STEPS:"
echo "1. Log out and log back in for group changes to take effect"
echo "   (or run: su - $ACTUAL_USER)"
echo "2. Ensure PostgreSQL is installed and running:"
echo "   sudo apt install postgresql postgresql-contrib"
echo "   sudo systemctl start postgresql"
echo "3. Create the database:"
echo "   sudo -u postgres createdb Heaven_Bakers"
echo "4. Set PostgreSQL password if needed:"
echo "   sudo -u postgres psql -c \"ALTER USER postgres PASSWORD 'postgres';\""
echo "5. Launch BloomSwiftPOS from your applications menu"
echo ""
echo "For thermal printer support, connect your printer and restart"
echo "the application after logging out and back in."
echo ""

exit 0
