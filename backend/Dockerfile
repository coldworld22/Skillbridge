FROM node:18-alpine

# Set working directory inside the container
WORKDIR /app
RUN apk add --no-cache curl ffmpeg

# Copy package.json and package-lock.json first (better build caching)
COPY package*.json ./

# Install dependencies (use ci for clean install)
RUN npm ci --only=production

# Copy the rest of the application files
COPY . .

# Expose port - match docker-compose.yml (5002)
EXPOSE 5002

# Start the backend server
CMD ["node", "src/server.js"]
