# Use the official Node.js 18 runtime as the parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package files to install dependencies first
COPY package*.json ./

# Install production dependencies (will use package-lock.json if present)
RUN npm ci --production

# Copy the rest of the application code
COPY . .

# Define default environment variables that can be overridden at runtime
ENV RAGAVAN_SYNOPSIS_MODEL=deepseek-r1:32b \
    RAGAVAN_TAGS_MODEL=deepseek-r1:14b \
    RAGAVAN_IMAGE_SYNOPSIS_MODEL=llava:latest \
    RAGAVAN_PORT=3000 \
    RAGAVAN_HOST_NAME=localhost

# Expose the default port (3000) the app will listen on
EXPOSE 3000

# Start the app using the entry file (update based on your actual entry file name)
CMD ["node", "app.js"]