FROM node:lts-bookworm

ENV DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza192aTRiX1dnWmdjcXJXSEs1OXVhbHoiLCJhcGlfa2V5IjoiMDFLNkJXSlZFUTkzVkpRMjY4QzA5OTc0VzMiLCJ0ZW5hbnRfaWQiOiJhYWRmOWQ4ZGE2NTkxNDJhMzIwYTE4MWNkMjQ3ZGMxZDJlYmU4OTIzNjYxNzY3MmQ4MDYyZDk2NWY0NGU1OTJiIiwiaW50ZXJuYWxfc2VjcmV0IjoiNjYyMDhjY2ItMTkyMy00MGRhLTk3NmUtMDc0MjAwMDhkMzQ5In0.qu-cZ4_8_gX7i4ag-ZoTmiPvibYYR5cyF_kt7hNanws
ENV PORT=8080

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

# Install Node.js dependencies
RUN if [ -f package.json ]; then npm install; fi

# Upgrade pip inside venv and install Python deps into the venv
RUN pip install --upgrade pip setuptools wheel
RUN if [ -f python/requirements.txt ]; then pip install -r python/requirements.txt; fi

# Copy the rest of the application code
COPY . .

# Make parser executable
RUN chmod +x python/parser.py

# Railway uses PORT env variable
ENV PORT=8080

# Default command (adjust as needed)
CMD ["npm", "start"]