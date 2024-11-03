FROM node:18 as build

WORKDIR /app

COPY package*.json ./

COPY . .

RUN npm install --force

RUN npm run build:prod

FROM nginx:alpine

COPY --from=build /app/dist/pegazzo-client/browser /usr/share/nginx/html

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
