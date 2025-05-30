# Dockerfile

# 1. Choose a base image. LTS version of Node.js is a good choice.
FROM node:18-alpine AS builder
# 'alpine' is a lightweight Linux distribution.
# Using 'AS builder' for a multi-stage build to keep the final image small.

# 2. Set the working directory inside the container
WORKDIR /usr/src/app

# 3. Copy package.json and package-lock.json (or yarn.lock)
# This leverages Docker's layer caching. These files change less often.
COPY package*.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy the rest of your application code into the working directory
COPY . .
# This includes your public folder, server.js, etc.
# .dockerignore will be respected here.

# ---- Production Image ----
# For the final image, we can use a slimmer base if needed,
# but for development, staying with the same Node version is simpler.
FROM node:18-alpine

WORKDIR /usr/src/app

# Copy dependencies from the builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Copy application code (excluding node_modules already copied)
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/server.js ./server.js

# We'll manage .env carefully - This comment applies to the next line
COPY --from=builder /usr/src/app/.env ./.env

# Expose the port the app runs on
EXPOSE 3000

# Run app with nodemon using npx
CMD ["npx", "nodemon", "server.js"]
