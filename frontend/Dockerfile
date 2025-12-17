# Build stage
FROM node:18 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force
COPY . .

# Default build-time environment variables.
ARG NEXT_PUBLIC_API_BASE_URL="http://localhost:5002/api"
ARG NEXT_PUBLIC_PGADMIN_URL="http://localhost:5050"
ARG APP_DOMAIN=""
ARG FRONTEND_MAX_OLD_SPACE_SIZE=6144
ARG FRONTEND_DISABLE_MINIFY=auto
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_PGADMIN_URL=$NEXT_PUBLIC_PGADMIN_URL \
    APP_DOMAIN=$APP_DOMAIN \
    NEXT_TELEMETRY_DISABLED=1 \
    FRONTEND_MAX_OLD_SPACE_SIZE=$FRONTEND_MAX_OLD_SPACE_SIZE \
    FRONTEND_DISABLE_MINIFY=$FRONTEND_DISABLE_MINIFY

# Source optional production env file if present before building.
RUN if [ -f .env.production ]; then set -a && . ./.env.production; fi \
    && npm run build \
    && rm -rf .next/cache

# Production stage
FROM node:18-alpine AS production
WORKDIR /app
RUN apk add --no-cache curl
COPY package.json package-lock.json next.config.mjs next-i18next.config.js ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["npm", "start"]
