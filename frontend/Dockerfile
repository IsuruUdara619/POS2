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

# Expose port 3000
EXPOSE 3000

# Start serve
CMD ["serve", "-s", "dist", "-l", "3000"]
