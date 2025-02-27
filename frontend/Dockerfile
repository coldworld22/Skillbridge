# Use Node.js LTS version
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy application source code
COPY . .

# Expose frontend port
EXPOSE 3000

# Start frontend
CMD ["npm", "run", "dev"]
