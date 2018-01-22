# Set the base image to Ubuntu
FROM node:latest

# Install nodemon
RUN npm install -g nodemon

# Provides cached layer for node_modules
ADD ./src/package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /app && cp -a /tmp/node_modules /app/

ENV NODE_ENV "production"

# Define working directory
WORKDIR /app
ADD ./src /app

# Run app using nodemon
CMD ["node", "/app/index.js"]