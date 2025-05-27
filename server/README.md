# API 3D Моделей

REST API для платформы обмена 3D моделями, построенное на Express.js и TypeScript.

## Технологии

- Node.js
- Express.js
- TypeScript
- Multer (для загрузки файлов)
- CORS

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

3. Запустите сервер
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
  │   ├── routes/     # Маршруты API
  │   ├── types/      # TypeScript интерфейсы
  │   ├── app.ts      # Конфигурация Express
  │   └── index.ts    # Точка входа
  ├── uploads/        # Директория для загруженных файлов
  ├── package.json
  └── tsconfig.json
```

## API Endpoints

### Основные endpoints

- `GET /` - Приветственное сообщение
- `GET /api/models` - Получить все модели
- `GET /api/models/:id` - Получить модель по ID
- `POST /api/models` - Загрузить новую модель
- `POST /api/models/:id/like` - Поставить лайк модели
- `GET /api/models/:id/download` - Скачать модель

### Параметры запросов

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

## Тестирование API

В проекте есть скрипт для тестирования всех endpoints:

```bash
# Для Windows PowerShell
.\test-api.ps1

# Для Unix-подобных систем
./test-api.sh
```

### Примеры cURL запросов

1. Получить все модели:
```bash
curl http://localhost:3000/api/models
```

2. Загрузить модель:
```bash
curl -X POST http://localhost:3000/api/models \
  -F "title=Тестовая модель" \
  -F "description=Описание модели" \
  -F "tags=[\"test\", \"example\"]" \
  -F "model=@path/to/model.stl"
```

3. Поставить лайк:
```bash
curl -X POST http://localhost:3000/api/models/1/like
```

## Ответы API

### Успешный ответ
```json
{
  "id": 1,
  "title": "Название модели",
  "description": "Описание",
  "fileUrl": "/uploads/model.stl",
  "thumbnailUrl": "/uploads/thumbnails/model.png",
  "fileType": "stl",
  "uploadedAt": "2024-01-20T12:00:00Z",
  "userId": 1,
  "tags": ["test", "example"],
  "likes": 0,
  "downloads": 0
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