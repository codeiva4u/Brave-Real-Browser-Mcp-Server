# Multi-platform Dockerfile with Brave Browser Support
# Supports: linux/amd64, linux/arm64, linux/arm/v7

FROM --platform=$TARGETPLATFORM node:18-slim

# Build arguments for multi-platform support
ARG TARGETPLATFORM
ARG BUILDPLATFORM
ARG TARGETARCH

# Install dependencies based on architecture
RUN apt-get update && \
    apt-get install -y \
        wget \
        gnupg \
        ca-certificates \
        fonts-liberation \
        libasound2 \
        libatk-bridge2.0-0 \
        libatk1.0-0 \
        libc6 \
        libcairo2 \
        libcups2 \
        libdbus-1-3 \
        libexpat1 \
        libfontconfig1 \
        libgcc1 \
        libgconf-2-4 \
        libgdk-pixbuf2.0-0 \
        libglib2.0-0 \
        libgtk-3-0 \
        libnspr4 \
        libnss3 \
        libpango-1.0-0 \
        libpangocairo-1.0-0 \
        libstdc++6 \
        libx11-6 \
        libx11-xcb1 \
        libxcb1 \
        libxcomposite1 \
        libxcursor1 \
        libxdamage1 \
        libxext6 \
        libxfixes3 \
        libxi6 \
        libxrandr2 \
        libxrender1 \
        libxss1 \
        libxtst6 \
        lsb-release \
        xdg-utils \
        xvfb \
        && rm -rf /var/lib/apt/lists/*

# Install Brave Browser based on architecture
RUN case "$TARGETARCH" in \
        amd64) \
            curl -fsSLo /usr/share/keyrings/brave-browser-archive-keyring.gpg https://brave-browser-apt-release.s3.brave.com/brave-browser-archive-keyring.gpg && \
            echo "deb [signed-by=/usr/share/keyrings/brave-browser-archive-keyring.gpg] https://brave-browser-apt-release.s3.brave.com/ stable main" | tee /etc/apt/sources.list.d/brave-browser-release.list && \
            apt-get update && \
            apt-get install -y brave-browser \
            ;; \
        arm64) \
            # For ARM64, install Brave from snap or build from source
            apt-get install -y snapd && \
            snap install brave || \
            (wget -O brave-arm64.deb https://github.com/brave/brave-browser/releases/latest/download/brave-browser_arm64.deb && \
            dpkg -i brave-arm64.deb || apt-get install -f -y) \
            ;; \
        arm) \
            # For ARM32, use Chromium as fallback since Brave doesn't have official ARM32 builds
            apt-get install -y chromium-browser \
            ;; \
        *) \
            echo "Unsupported architecture: $TARGETARCH" && exit 1 \
            ;; \
    esac && \
    rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY .puppeteerrc.cjs ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Build the application
RUN npm run build

# Set environment variables for Brave
ENV BRAVE_PATH=/usr/bin/brave-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/brave-browser

# For headless environments
ENV DISPLAY=:99

# Create a non-root user
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

# Switch to non-root user
USER pptruser

# Expose MCP server port
EXPOSE 3000

# Start with Xvfb for headless support
CMD xvfb-run -a --server-args="-screen 0 1280x1024x24" npm start
