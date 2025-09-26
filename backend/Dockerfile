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
COPY backend/src/migrations/ ./src/migrations/
# Fail the build immediately if the critical verification migrations are
# missing from the build context. This prevents publishing an image that
# cannot run `knex migrate:latest` because Knex validates the migrations list
# against the database history.
RUN set -eux; \
    ls -1 src/migrations > /dev/null; \
    for migration in \
      src/migrations/20250926123707_alter_verifications_code_to_text.js \
      src/migrations/20250926124314_alter_verifications_code_to_text.js; do \
        test -f "${migration}"; \
    done
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
