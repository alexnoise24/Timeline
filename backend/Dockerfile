# Use a small Node image
FROM node:22-alpine

# Create app directory
WORKDIR /app

# Install dependencies first (leverage Docker layer cache)
COPY package*.json ./
RUN npm ci --only=production || npm ci

# Copy source
COPY . .

# Copy production environment file
COPY .env.production .env

# Set environment
ENV NODE_ENV=production

# Cloud Run will set PORT env var. Our server reads process.env.PORT.
EXPOSE 8080

# Start the server
CMD ["node", "server.js"]
