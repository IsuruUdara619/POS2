# Stage 1: Build the application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Pass build arguments
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build the application
RUN npm run build

# Stage 2: Serve with serve
FROM node:20-alpine

# Install serve globally
RUN npm install -g serve

# Copy built assets from builder stage
COPY --from=builder /app/dist /app/dist

# Set working directory
WORKDIR /app

# Expose port (default 3000, but Railway will override via PORT env)
EXPOSE 3000

# Start serve using the PORT environment variable if available, otherwise default to 3000
CMD serve -s dist -l tcp://0.0.0.0:${PORT:-3000}
