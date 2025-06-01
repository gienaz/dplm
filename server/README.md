# API для 3D моделей

Серверная часть приложения для управления и работы с 3D моделями. API позволяет загружать, хранить и управлять 3D моделями, а также обеспечивает аутентификацию пользователей.

## Технологии

- Node.js
- Express
- TypeScript
- PostgreSQL
- Docker
- JWT для аутентификации

## Структура проекта

```
server/
  ├── src/               - Исходный код на TypeScript
  │   ├── data/          - Работа с данными и БД
  │   │   ├── mockDb.ts  - Моки для разработки и тестов
  │   │   └── postgresDb.ts - Реализация доступа к PostgreSQL
  │   ├── middleware/    - Промежуточные обработчики
  │   │   ├── auth.ts    - Аутентификация и авторизация
  │   │   └── validation.ts - Валидация запросов
  │   ├── routes/        - Маршруты API
  │   │   ├── auth.ts    - Маршруты для авторизации
  │   │   └── models.ts  - Маршруты для работы с моделями
  │   ├── types/         - Типы данных
  │   ├── app.ts         - Конфигурация Express приложения
  │   └── index.ts       - Точка входа
  ├── test/              - Тесты
  ├── uploads/           - Директория для загружаемых моделей
  ├── thumbnails/        - Директория для миниатюр
  ├── docker/            - Docker конфигурация
  │   ├── Dockerfile     - Сборка образа для сервера
  │   ├── scripts/       - Вспомогательные скрипты
  │   │   ├── build.js   - Скрипт для сборки TypeScript
  │   │   ├── docker-manager.ps1 - Управление Docker контейнерами
  │   │   └── wait-for-postgres.sh - Скрипт ожидания готовности БД
  │   └── README.md      - Документация по Docker
  ├── .env               - Переменные окружения (создается автоматически)
  ├── tsconfig.json      - Настройки TypeScript
  └── package.json       - Зависимости и скрипты NPM
```

## Запуск сервера

### Запуск с использованием Docker

Самый простой способ запустить сервер вместе с PostgreSQL:

```bash
# Из корневой директории проекта
docker-compose up -d --build
```

Для Windows также доступен PowerShell скрипт:

```powershell
# Полный запуск (API + PostgreSQL)
.\server\docker\scripts\docker-manager.ps1 -mode full

# С полной очисткой Docker (если возникли проблемы)
.\server\docker\scripts\docker-manager.ps1 -mode full -clean
```

### Локальная разработка

Для локальной разработки можно запустить только PostgreSQL в Docker, а сервер запускать локально:

```bash
# Запуск только PostgreSQL
docker-compose up -d postgres

# В отдельном терминале
cd server
npm install
npm run dev
```

Или с использованием скрипта (для Windows):

```powershell
# Запуск PostgreSQL для локальной разработки
.\server\docker\scripts\docker-manager.ps1 -mode dev -host localhost
cd server
npm run dev
```

## Переменные окружения

Сервер использует следующие переменные окружения (создаются автоматически или можно настроить вручную в файле `.env`):

```
PORT=3000                      # Порт для запуска сервера
POSTGRES_USER=postgres         # Пользователь PostgreSQL
POSTGRES_PASSWORD=postgres     # Пароль PostgreSQL
POSTGRES_DB=models3d           # Имя базы данных
POSTGRES_HOST=postgres         # Хост PostgreSQL (postgres для Docker, localhost для локальной разработки)
POSTGRES_PORT=5432             # Порт PostgreSQL
JWT_SECRET=your_secret_key     # Секретный ключ для JWT токенов
```

## API Endpoints

### Аутентификация

- `POST /api/auth/register` - Регистрация нового пользователя
- `POST /api/auth/login` - Вход в систему

### Модели

- `GET /api/models` - Получение списка всех моделей
- `GET /api/models/:id` - Получение информации о конкретной модели
- `POST /api/models` - Загрузка новой модели
- `PUT /api/models/:id` - Обновление информации о модели
- `DELETE /api/models/:id` - Удаление модели

## База данных

Приложение использует PostgreSQL в качестве основной базы данных. При первом запуске база данных инициализируется автоматически с созданием необходимых таблиц.

## Тестирование

```bash
# Запуск тестов
npm test

# Запуск тестов с отслеживанием изменений
npm run test:watch

# Запуск тестов с отчетом о покрытии
npm run test:coverage
```

## Разработка

Для разработки используется TypeScript. Исходный код находится в директории `src/`. При сборке код компилируется в JavaScript в директорию `dist/`.

```bash
# Компиляция TypeScript
npm run build

# Запуск сервера в режиме разработки (с автоматической перезагрузкой)
npm run dev

# Запуск скомпилированной версии
npm start
``` 