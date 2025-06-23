#!/bin/sh
set -e

# Set default PORT if not provided
export PORT=${PORT:-8080}

# Replace ${PORT} with the value of the PORT environment variable
envsubst '$PORT' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Verify the configuration was created correctly
echo "Generated nginx.conf:"
cat /etc/nginx/nginx.conf

# Test nginx configuration
nginx -t

# Start Nginx in the foreground
nginx -g 'daemon off;' 