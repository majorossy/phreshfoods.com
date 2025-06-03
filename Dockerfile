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

# Expose the port the app runs on
EXPOSE 3000

# Run app with nodemon using npx
CMD ["npx", "nodemon", "server.js"]
