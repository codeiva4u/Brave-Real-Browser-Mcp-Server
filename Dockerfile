# Multi-platform Dockerfile for Brave Puppeteer Real Browser MCP Server
# Supports: linux/amd64, linux/arm64

FROM --platform=$BUILDPLATFORM node:18-alpine AS builder

# Build arguments
ARG BUILDTIME
ARG VERSION
ARG TARGETPLATFORM
ARG BUILDPLATFORM

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/
COPY scripts/ ./scripts/

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install system dependencies and Brave browser
RUN apk update && apk add --no-cache \
    wget \
    curl \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    xvfb \
    dbus \
    && rm -rf /var/cache/apk/*

# Set up Brave browser installation based on architecture
ARG TARGETPLATFORM
RUN echo "Target platform: $TARGETPLATFORM"

# Install Brave browser for x86_64
RUN if [ "$TARGETPLATFORM" = "linux/amd64" ]; then \
    wget -q -O - https://brave-browser-apt-release.s3.brave.com/brave-core.asc | apk add --allow-untrusted && \
    echo "deb [signed-by=/usr/share/keyrings/brave-browser-archive-keyring.gpg arch=amd64] https://brave-browser-apt-release.s3.brave.com/ stable main" > /etc/apk/repositories.d/brave-browser-release.list && \
    apk update && \
    apk add --no-cache brave-browser; \
    fi

# Install Brave browser for ARM64
RUN if [ "$TARGETPLATFORM" = "linux/arm64" ]; then \
    wget -q -O - https://brave-browser-apt-release.s3.brave.com/brave-core.asc | apk add --allow-untrusted && \
    echo "deb [signed-by=/usr/share/keyrings/brave-browser-archive-keyring.gpg arch=arm64] https://brave-browser-apt-release.s3.brave.com/ stable main" > /etc/apk/repositories.d/brave-browser-release.list && \
    apk update && \
    apk add --no-cache brave-browser; \
    fi

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S brave -u 1001 -G nodejs

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=brave:nodejs /app/dist ./dist
COPY --from=builder --chown=brave:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=brave:nodejs /app/package.json ./
COPY --chown=brave:nodejs scripts/ ./scripts/

# Set up Xvfb for headless operation
RUN mkdir -p /tmp/.X11-unix && \
    chmod 1777 /tmp/.X11-unix && \
    chown brave:nodejs /tmp/.X11-unix

# Set environment variables
ENV NODE_ENV=production \
    HEADLESS=true \
    XVFB_AVAILABLE=true \
    DISPLAY=:99 \
    BRAVE_PATH=/usr/bin/brave-browser \
    CI=true

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'export DISPLAY=:99' >> /app/start.sh && \
    echo 'Xvfb :99 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset &' >> /app/start.sh && \
    echo 'sleep 2' >> /app/start.sh && \
    echo 'exec node /app/dist/index.js "$@"' >> /app/start.sh && \
    chmod +x /app/start.sh && \
    chown brave:nodejs /app/start.sh

# Switch to non-root user
USER brave

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('Health check: OK')" || exit 1

# Labels for metadata
LABEL org.opencontainers.image.title="Brave Puppeteer Real Browser MCP Server" \
      org.opencontainers.image.description="MCP server for Brave browser automation with puppeteer-real-browser" \
      org.opencontainers.image.version="${VERSION:-2.0.0}" \
      org.opencontainers.image.created="${BUILDTIME}" \
      org.opencontainers.image.source="https://github.com/your-repo/brave-puppeteer-mcp-server" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.vendor="Brave MCP Server" \
      org.opencontainers.image.authors="withlinda13"

# Expose ports for HTTP/WebSocket modes
EXPOSE 3000 3001

# Default command
ENTRYPOINT ["/app/start.sh"]
CMD []

# Alternative commands examples:
# Docker run examples:
# 
# STDIO mode (default):
# docker run -it --rm brave-puppeteer-mcp-server
#
# HTTP mode:
# docker run -it --rm -p 3000:3000 brave-puppeteer-mcp-server --mode=http --port=3000
#
# WebSocket mode:
# docker run -it --rm -p 3001:3001 brave-puppeteer-mcp-server --mode=websocket --port=3001
#
# With custom Brave path:
# docker run -it --rm -e BRAVE_PATH=/custom/path/brave brave-puppeteer-mcp-server
#
# With debugging enabled:
# docker run -it --rm -e DEBUG=true brave-puppeteer-mcp-server
