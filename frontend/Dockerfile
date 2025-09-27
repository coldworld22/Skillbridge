# Build stage
FROM node:20 AS builder
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
COPY frontend/scripts/normalize-package-json.js /tmp/normalize-package-json.js
RUN node /tmp/normalize-package-json.js package.json \
    && npm ci && npm cache clean --force
COPY frontend/ ./
COPY shared /shared

# Ensure subsequent RUN instructions use bash so pipefail is respected.
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Default build-time environment variables.
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_PGADMIN_URL="http://localhost:5050"
ARG APP_DOMAIN=""
ARG INTERNAL_API_BASE_URL=""
ARG STRICT_PUBLIC_API=true
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_PGADMIN_URL=$NEXT_PUBLIC_PGADMIN_URL \
    APP_DOMAIN=$APP_DOMAIN \
    INTERNAL_API_BASE_URL=$INTERNAL_API_BASE_URL \
    STRICT_PUBLIC_API=$STRICT_PUBLIC_API

# Ensure subsequent RUN commands execute with pipefail enabled.
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Source optional production env file if present before building.
RUN \
    if [ -f .env.production ]; then \
        set -a && . ./.env.production && set +a; \
    fi; \
    if [ -z "${NEXT_PUBLIC_API_BASE_URL:-}" ]; then \
        echo "NEXT_PUBLIC_API_BASE_URL must be provided via --build-arg or .env.production" >&2; \
        exit 1; \
    fi; \
    if [[ "$NEXT_PUBLIC_API_BASE_URL" == /* ]] && [ -z "${APP_DOMAIN:-}" ]; then \
        echo "APP_DOMAIN must be set when NEXT_PUBLIC_API_BASE_URL is provided as a relative path" >&2; \
        exit 1; \
    fi; \
    case "$NEXT_PUBLIC_API_BASE_URL" in \
        http://localhost*|http://127.0.0.1*|http://0.0.0.0*|http://\[::1\]*|http://backend*|/*) \
            ;; \
        http://*) \
            echo "NEXT_PUBLIC_API_BASE_URL (${NEXT_PUBLIC_API_BASE_URL}) must use HTTPS for public hosts" >&2; \
            exit 1; \
            ;; \
    esac; \
    npm run build

# Revert to the default shell for subsequent stages.
SHELL ["/bin/sh", "-c"]

# Production stage
FROM node:20-alpine AS production
WORKDIR /app
RUN apk add --no-cache curl
COPY frontend/package.json frontend/package-lock.json frontend/next.config.mjs frontend/next-i18next.config.js ./
COPY frontend/scripts/normalize-package-json.js /tmp/normalize-package-json.js
RUN node /tmp/normalize-package-json.js package.json \
    && npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /shared /shared
RUN addgroup -S app && adduser -S -G app app && chown -R app:app /app
EXPOSE 3000
USER app
CMD ["npm", "start"]
