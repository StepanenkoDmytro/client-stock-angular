FROM node:18 as build

WORKDIR /app

COPY package*.json ./

COPY . .

RUN npm install --force

# Build the Angular app for production
RUN npm run build:prod

FROM node:18

WORKDIR /app

# Копіюємо побудований Angular застосунок з першого етапу
COPY --from=build /app/dist/pegazzo-client/browser /app

# Встановлюємо простий статичний сервер для обслуговування файлів
RUN npm install -g http-server

# Порт для сервера
EXPOSE 4200

# Запускаємо http-server для обслуговування файлів
CMD ["http-server", "/app", "-p", "4200"]
