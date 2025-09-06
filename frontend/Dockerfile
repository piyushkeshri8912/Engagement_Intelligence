# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S reactuser -u 1001

# Change ownership of app directory
RUN chown -R reactuser:nodejs /app

# Switch to non-root user
USER reactuser

# Expose port
EXPOSE 3000

# Start the development server
CMD ["npm", "start"]
