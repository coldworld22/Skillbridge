# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache curl netcat-openbsd postgresql-client
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY ./ ./

# Production stage
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache curl netcat-openbsd postgresql-client su-exec && \
    (id -u node 2>/dev/null || adduser -S node)
COPY --from=builder /app ./
RUN chmod +x scripts/wait-for-db.sh scripts/docker-entrypoint.sh
EXPOSE 5002
ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
CMD ["node", "src/server.js"]
