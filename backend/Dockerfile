# Use official Node.js image
FROM node:18-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose port (Ensure it matches the one in .env)
EXPOSE 5000

# Start the backend server
CMD ["node", "src/server.js"]
