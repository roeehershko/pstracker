# Set nginx base image
FROM nginx

# Health check for the service
HEALTHCHECK CMD curl --fail http://localhost/ || exit 1

# Copy custom configuration file from the current directory
COPY nginx.conf /etc/nginx/nginx.conf