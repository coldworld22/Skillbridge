# Build stage
FROM node:18 AS builder
ARG NEXT_PUBLIC_API_BASE_URL
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force
COPY . .
ARG NEXT_PUBLIC_API_BASE_URL
RUN NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL npm run build

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
