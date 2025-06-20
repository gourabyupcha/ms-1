# Use the official Node.js LTS image
FROM node:20

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose port 1111 to the host
EXPOSE 1111

# Command to run the app
CMD ["node", "src/server.js"]