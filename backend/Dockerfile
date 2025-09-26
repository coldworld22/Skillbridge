# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache bash curl netcat-openbsd postgresql-client

# Copy the backend package manifests first to leverage Docker layer caching.
COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy the backend source along with the installer assets so the
# production image can serve /install even when the container is built
# independently of the repository root. Copy the migrations directory
# explicitly to guarantee that new migration files are always included in
# the build context.
COPY backend/ ./
COPY backend/src/migrations ./src/migrations
COPY install ./install
COPY install.sh ./install.sh
COPY scripts/check_prereqs.sh ./scripts/check_prereqs.sh

# Production stage
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache bash curl netcat-openbsd postgresql-client su-exec && \
    (id -u node 2>/dev/null || adduser -S node)
COPY --from=builder /app ./
COPY scripts /scripts
COPY install.sh /install.sh
RUN chmod +x scripts/wait-for-db.sh scripts/docker-entrypoint.sh \
    && chmod +x /scripts/check_prereqs.sh /install.sh
EXPOSE 5002
ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
CMD ["node", "src/server.js"]
