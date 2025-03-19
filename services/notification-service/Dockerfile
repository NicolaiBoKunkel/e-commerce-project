# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Set environment variables
ENV PORT=5004

# Expose the port
EXPOSE 5004

# Start the service
CMD ["npm", "run", "start"]
