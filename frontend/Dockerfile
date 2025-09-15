# Build stage
FROM node:20 AS builder
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci && npm cache clean --force
COPY frontend/ ./
COPY shared /shared

# Default build-time environment variables.
ARG NEXT_PUBLIC_API_BASE_URL="http://localhost:5002/api"
ARG NEXT_PUBLIC_PGADMIN_URL="http://localhost:5050"
ARG APP_DOMAIN=""
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_PGADMIN_URL=$NEXT_PUBLIC_PGADMIN_URL \
    APP_DOMAIN=$APP_DOMAIN

# Source optional production env file if present before building.
RUN set -a && [ -f .env.production ] && . .env.production; npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app
RUN apk add --no-cache curl
COPY frontend/package.json frontend/package-lock.json frontend/next.config.mjs frontend/next-i18next.config.js ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /shared /shared
EXPOSE 3000
CMD ["npm", "start"]
