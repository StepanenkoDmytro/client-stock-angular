# FROM node:latest as node
# WORKDIR /app
# COPY . .
# RUN npm install
# RUN npm run build ----configuration --aot

# stage 2
FROM nginx:alpine
COPY ./dist/pegazzo-client/browser /usr/share/nginx/html
# COPY --from=node /app/dist/pegazzo-client/browser /usr/share/nginx/html
