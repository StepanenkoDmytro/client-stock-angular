FROM node:latest as node
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build --prod --aot

# stage 2
FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=node /app/dist/archive-assets /usr/share/nginx/html