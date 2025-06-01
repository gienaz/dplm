FROM node:18-alpine

WORKDIR /app

# Устанавливаем PostgreSQL клиент
RUN apk add --no-cache postgresql-client

# Копируем файлы package.json и package-lock.json для установки зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем конфигурацию TypeScript и скрипты
COPY tsconfig.json ./
COPY docker/scripts/build.js ./

# Копируем исходный код
COPY src/ ./src/

# Даем права на выполнение скрипту ожидания
COPY docker/scripts/wait-for-postgres.sh ./wait-for-postgres.sh
RUN chmod +x ./wait-for-postgres.sh

# Создаем директории для файлов
RUN mkdir -p uploads thumbnails dist

# Компилируем TypeScript с помощью нашего универсального скрипта
RUN node build.js

# Проверим, что dist создан и содержит index.js
RUN echo "Содержимое директории dist после компиляции:" && ls -la dist/
RUN test -f dist/index.js || { echo "Ошибка: файл dist/index.js не создан"; exit 1; }

# Указываем порт, который будет слушать приложение
EXPOSE 3000

# Команда для запуска приложения
CMD ["node", "dist/index.js"] 