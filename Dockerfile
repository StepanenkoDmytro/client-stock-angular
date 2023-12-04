FROM node:latest as node
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build --prod --aot

# stage 2
FROM nginx:alpine
COPY --from=node /app/dist/archive-assets /usr/share/nginx/html