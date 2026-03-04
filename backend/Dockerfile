# Use Node.js 20 Slim (Debian Bookworm) for better native module support (glibc)
FROM node:20-slim

# Install dependencies for Canvas and Puppeteer
# - build-essential, python3, etc. for building native modules (node-gyp)
# - libcairo2-dev, etc. for canvas
# - chromium for puppeteer
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    chromium \
    ca-certificates \
    fonts-freefont-ttf \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use the installed Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy application code
COPY . .

# Expose port
EXPOSE 8080

# Start the application
CMD ["npm", "start"]
