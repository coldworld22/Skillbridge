# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache curl netcat-openbsd postgresql-client
COPY package*.json ./
RUN npm ci && npm cache clean --force
COPY ./ ./
COPY shared /shared

# Production stage
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache curl netcat-openbsd postgresql-client && \
    (id -u node 2>/dev/null || adduser -S node)
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --from=builder /app/src ./src
COPY --from=builder /app/knexfile.js ./knexfile.js
COPY --from=builder /shared /shared
COPY --from=builder /app/scripts ./scripts
RUN chmod +x scripts/wait-for-db.sh scripts/docker-entrypoint.sh && \
    chown -R node:node /app
EXPOSE 5002
USER node
ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
CMD ["node", "src/server.js"]
