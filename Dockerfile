FROM node:lts-bookworm-slim

# Install only what's required for headless Chromium
RUN apt-get update && apt-get install -y \
    chromium \
    libnss3 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libxshmfence1 \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Let Puppeteer know to use system Chromium and skip its own download
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true
# Install Python and venv support
RUN apt-get update && \
    apt-get install -y python3 python3-venv python3-pip build-essential && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Prepare python venv
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy package.json and requirements.txt early for caching
COPY package.json ./
COPY python/requirements.txt ./python/requirements.txt

# Copy the rest of the application code
COPY . .

# Install Node.js dependencies
RUN if [ -f package.json ]; then npm install; fi

# Upgrade pip inside venv and install Python deps into the venv
RUN pip install --upgrade pip setuptools wheel
RUN if [ -f python/requirements.txt ]; then pip install -r python/requirements.txt; fi

# Make parser executable
RUN chmod +x python/parser.py python/scraper.py

# Railway uses PORT env variable
ENV PORT=8080

# Default command (adjust as needed)
CMD ["npm", "start"]