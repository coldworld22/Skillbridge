# Use Node.js LTS version
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and lock file
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy rest of the app
COPY . .

# Build the Next.js app
RUN npm run build

# Expose Next.js port
EXPOSE 3000

# Start the production server
CMD ["npm", "start"]
