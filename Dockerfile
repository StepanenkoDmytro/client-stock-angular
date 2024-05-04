FROM node:18 as build

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Copy the entire application code to the container
COPY . .

# Install dependencies
RUN npm install --force

# Build the Angular app for production
RUN npm run build:prod

# Use Nginx as the production server
FROM nginx:alpine

# Copy the built React app to Nginx's web server directory
COPY --from=build /app/dist/pegazzo-client/browser /usr/share/nginx/html
#COPY ./dist/pegazzo-client/browser /usr/share/nginx/html

# Copy nginx.conf to Nginx's configuration directory
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 81 for the Nginx server
EXPOSE 81

# Start Nginx when the container runs
CMD ["nginx", "-g", "daemon off;"]
