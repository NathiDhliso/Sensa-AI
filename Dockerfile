# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Install gettext for envsubst
RUN apk update && apk add --no-cache gettext curl

# Copy the build output from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the Nginx config template and the startup script
COPY nginx.conf.template /etc/nginx/nginx.conf.template
COPY start-nginx.sh /usr/local/bin/start-nginx.sh

# Make the startup script executable
RUN chmod +x /usr/local/bin/start-nginx.sh

# Expose port 80 - Nginx will listen on the PORT env var, but this is good practice
EXPOSE 80

# Healthcheck can now use the PORT variable
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f "http://localhost:${PORT:-80}/" || exit 1

# Run the startup script
CMD ["start-nginx.sh"] 