# Set the base image to Ubuntu
FROM node:latest

# Install nodemon
RUN npm install -g nodemon

# Provides cached layer for node_modules
ADD ./package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /src && cp -a /tmp/node_modules /src/

ENV NODE_ENV "production"

# Define working directory
WORKDIR /src
ADD . /src

# Health check for the service
HEALTHCHECK CMD curl --fail http://localhost:3000/ || exit 1

# Expose port
EXPOSE  3000

# Run app using nodemon
CMD ["node", "/src/index.js"]