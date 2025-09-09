# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
RUN apk add --no-cache curl
COPY package*.json ./
RUN npm ci && npm cache clean --force
COPY . .
RUN npm test

# Production stage
FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache curl && \
    (id -u node 2>/dev/null || adduser -S node)
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --from=builder /app/src ./src
COPY --from=builder /app/knexfile.js ./knexfile.js
RUN chown -R node:node /app
EXPOSE 5002
USER node
CMD ["node", "src/server.js"]
