FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY tsconfig.json ./
COPY src ./src
COPY public ./public

# Build TypeScript
RUN npm install -g typescript
RUN npm run build

# Remove dev dependencies and TypeScript compiler
RUN npm prune --production
RUN npm uninstall -g typescript

# Expose ports
EXPOSE 3000 3001

# Create sandbox directory
RUN mkdir -p /app/sandbox

# Set environment
ENV NODE_ENV=production

# Start application
CMD ["node", "dist/index.js"]
