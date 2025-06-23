#!/bin/sh
set -e

# Replace ${PORT} with the value of the PORT environment variable and save it to the final nginx config file.
# The 'g' flag ensures that if for some reason ${PORT} appears multiple times, all instances are replaced.
envsubst 'g' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Start Nginx in the foreground
nginx -g 'daemon off;' 