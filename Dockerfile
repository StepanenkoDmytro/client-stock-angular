FROM node:18 AS build

WORKDIR /app

COPY package*.json ./

COPY . .

RUN npm install --force

# Which Angular build configuration to use:
#   prod (default) → environment.ts          → https://pegazzo.online/...
#   dev            → environment.development.ts → http://localhost:8000/api/v1
# Override via:  --build-arg BUILD_MODE=dev
# (docker-compose.local.yml already does this for the local stack.)
ARG BUILD_MODE=prod
RUN npm run build:${BUILD_MODE}

FROM nginx:alpine

COPY --from=build /app/dist/pegazzo-client/browser /usr/share/nginx/html

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
