# API 3D Моделей

REST API для платформы обмена 3D моделями, построенное на Express.js и TypeScript.

## Технологии

- Node.js
- Express.js
- TypeScript
- Multer (для загрузки файлов)
- CORS
- JWT (для аутентификации)
- bcryptjs (для хэширования паролей)

## Установка

1. Клонируйте репозиторий
```bash
git clone <your-repo-url>
cd server
```

2. Установите зависимости
```bash
npm install
```

3. Создайте файл .env в корневой директории и добавьте следующие переменные:
```env
PORT=3000
JWT_SECRET=your-super-secret-key-change-in-production
```

4. Запустите сервер
```bash
# Режим разработки с автоперезагрузкой
npm run dev

# Сборка TypeScript
npm run build

# Запуск production версии
npm start
```

По умолчанию сервер запускается на порту 3000.

## Структура проекта

```
server/
  ├── src/
  │   ├── config/     # Конфигурация (загрузка файлов)
  │   ├── middleware/ # Промежуточное ПО (auth)
  │   ├── routes/     # Маршруты API
  │   ├── types/      # TypeScript интерфейсы
  │   ├── app.ts      # Конфигурация Express
  │   └── index.ts    # Точка входа
  ├── uploads/        # Директория для загруженных файлов
  ├── package.json
  └── tsconfig.json
```

## API Endpoints

### Аутентификация

- `POST /api/auth/register` - Регистрация нового пользователя
- `POST /api/auth/login` - Вход пользователя

### Модели

- `GET /api/models` - Получить все модели
- `GET /api/models/:id` - Получить модель по ID
- `POST /api/models` - Загрузить новую модель (требуется авторизация)
- `POST /api/models/:id/like` - Поставить лайк модели (требуется авторизация)
- `GET /api/models/:id/download` - Скачать модель (требуется авторизация)
- `DELETE /api/models/:id` - Удалить модель (только для админов)

### Параметры запросов

#### POST /api/auth/register
```json
{
  "name": "Имя пользователя",
  "email": "user@example.com",
  "password": "password123"
}
```

#### POST /api/auth/login
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### GET /api/models
Поддерживает следующие query-параметры:
- `page` (число): Номер страницы (по умолчанию: 1)
- `limit` (число): Количество моделей на странице (по умолчанию: 20)
- `tag` (строка): Фильтрация по тегу
- `sort` (строка): Сортировка ('likes', 'downloads', 'recent')

#### POST /api/models
Multipart form-data с полями:
- `title` (строка): Название модели
- `description` (строка): Описание модели
- `tags` (JSON строка): Массив тегов
- `model` (файл): STL, OBJ или glTF файл

## Поддерживаемые форматы файлов

- STL (.stl)
- OBJ (.obj)
- glTF (.gltf)

Максимальный размер файла: 100MB

## Аутентификация

API использует JWT (JSON Web Tokens) для аутентификации. После успешной регистрации или входа, сервер возвращает токен, который нужно включать в заголовок Authorization для защищенных endpoints:

```bash
Authorization: Bearer <your-token>
```

### Роли пользователей

- **Пользователь**: Может загружать, скачивать и лайкать модели
- **Администратор**: Имеет все права пользователя + может удалять модели

По умолчанию создается один администратор:
- Email: admin@example.com
- Пароль: admin123

## Тестирование API

### Примеры cURL запросов

1. Регистрация:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

2. Вход:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

3. Загрузка модели (с токеном):
```bash
curl -X POST http://localhost:3000/api/models \
  -H "Authorization: Bearer <your-token>" \
  -F "title=Тестовая модель" \
  -F "description=Описание модели" \
  -F "tags=[\"test\", \"example\"]" \
  -F "model=@path/to/model.stl"
```

## Ответы API

### Успешный ответ аутентификации
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "Test User",
    "email": "test@example.com",
    "role": "user"
  }
}
```

### Ответ с ошибкой
```json
{
  "message": "Текст ошибки"
}
```

## Разработка

### Сборка проекта
```bash
npm run build
```

### Запуск тестов
```bash
npm test
```

## Лицензия

MIT 