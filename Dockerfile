# Multi-stage build for production
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy only necessary files for build
COPY tsconfig.json nest-cli.json ./
COPY src ./src

# Build TypeScript (clean build)
RUN yarn build && echo "Build command completed"

# Verify build output (show first level and main.js specifically)
RUN ls -la /app/dist && \
    echo "✅ Build completed successfully" && \
    echo "Checking for main.js:" && \
    ls -la /app/dist/main.js || echo "❌ main.js not found!"

# Production stage
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install only production dependencies
RUN yarn install --frozen-lockfile --production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Verify copied files
RUN ls -la /app/dist && echo "✅ Dist files copied successfully"

# Expose port
EXPOSE 8080

# Set environment to production
ENV NODE_ENV=production
ENV PORT=8080

# Start application
CMD ["node", "dist/main.js"]
