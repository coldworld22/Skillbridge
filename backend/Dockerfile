# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
RUN apk add --no-cache curl netcat-openbsd
COPY package*.json ./
RUN npm ci && npm cache clean --force
COPY . ./
COPY shared /shared

# Production stage
FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache curl netcat-openbsd && \
    (id -u node 2>/dev/null || adduser -S node)
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --from=builder /app/src ./src
COPY --from=builder /app/knexfile.js ./knexfile.js
COPY --from=builder /shared /shared
COPY --from=builder /app/scripts ./scripts
RUN chmod +x scripts/wait-for-db.sh && \
    chown -R node:node /app
EXPOSE 5002
USER node
CMD ["sh", "-c", "npx knex migrate:latest && node src/server.js"]
