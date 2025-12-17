# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
RUN apk add --no-cache bash curl
COPY package*.json ./
RUN npm ci && npm cache clean --force
COPY . .
RUN npm test

# Production stage
FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache bash curl git docker-cli docker-cli-compose
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --from=builder /app/src ./src
COPY --from=builder /app/knexfile.js ./knexfile.js
EXPOSE 5002
CMD ["node", "src/server.js"]
