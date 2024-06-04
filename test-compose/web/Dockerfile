# Use the official Node.js image to build the app
FROM node:20.10.0 AS build

# Set the working directory
WORKDIR /usr/local/app

# Copy package.json and package-lock.json to the working directory
COPY web/ .

# Install dependencies
RUN npm install --verbose

# Build the Angular application
RUN npm run build

# Use a lightweight web server to serve the built files
FROM nginx:latest

# Copy the built files from the previous stage
COPY --from=build /usr/local/app/dist/web/browser /usr/share/nginx/html

# Copy custom nginx configuration
COPY web/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80
