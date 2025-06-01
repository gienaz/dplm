# API для 3D моделей

Серверная часть приложения для управления и работы с 3D моделями. API позволяет загружать, хранить и управлять 3D моделями, а также обеспечивает аутентификацию пользователей.

## Технологии

- Node.js
- Express
- TypeScript
- PostgreSQL
- Docker
- MinIO для хранения файлов
- JWT для аутентификации
- Jest и SuperTest для тестирования

## Архитектура решения

```
+-------------+     +-------------+     +-------------+
|             |     |             |     |             |
| Web-клиент  +---->+  API сервер +---->+    MinIO    |
|             |     |             |     |             |
+-------------+     +------+------+     +-------------+
                           |
                           v
                    +------+------+
                    |             |
                    | PostgreSQL  |
                    |             |
                    +-------------+
```

- **Web-клиент** отправляет 3D-модели на сервер
- **API сервер** сохраняет метаданные в PostgreSQL, а сами файлы в MinIO
- **MinIO** хранит файлы 3D-моделей
- **PostgreSQL** хранит метаданные и ссылки на файлы в MinIO

## Структура проекта

```
server/
  ├── src/               - Исходный код на TypeScript
  │   ├── data/          - Работа с данными и БД
  │   │   ├── postgresDb.ts - Реализация доступа к PostgreSQL
  │   │   ├── storageService.ts - Сервис для работы с хранилищем файлов
  │   │   └── storageService.mock.ts - Мок сервиса для тестирования
  │   ├── middleware/    - Промежуточные обработчики
  │   │   ├── auth.ts    - Аутентификация и авторизация
  │   │   └── validation.ts - Валидация запросов
  │   ├── routes/        - Маршруты API
  │   │   ├── auth.ts    - Маршруты для авторизации
  │   │   └── models.ts  - Маршруты для работы с моделями
  │   ├── scripts/       - Вспомогательные скрипты
  │   │   ├── init-minio.ts - Инициализация MinIO
  │   │   └── migrate-to-minio.ts - Миграция файлов в MinIO
  │   ├── tests/         - Тесты API
  │   │   ├── auth.test.ts - Тесты авторизации
  │   │   ├── models.test.ts - Тесты работы с моделями
  │   │   ├── database.test.ts - Тесты функций БД
  │   │   ├── middleware.test.ts - Тесты middleware
  │   │   ├── setup.ts   - Настройка тестового окружения
  │   │   ├── createTestDb.ts - Создание тестовой БД
  │   │   └── testUtils.ts - Вспомогательные функции для тестов
  │   ├── types/         - Типы данных
  │   ├── app.ts         - Конфигурация Express приложения
  │   └── index.ts       - Точка входа
  ├── docker/            - Docker конфигурация
  │   ├── Dockerfile     - Сборка образа для сервера
  │   └── scripts/       - Вспомогательные скрипты
  ├── config.ts          - Конфигурационный файл
  ├── tsconfig.json      - Настройки TypeScript
  └── package.json       - Зависимости и скрипты NPM
```

## Запуск сервера

### Запуск с использованием Docker

```bash
# Из корневой директории проекта
docker-compose up -d --build
```

Для Windows также доступен PowerShell скрипт:

```powershell
# Полный запуск (API + PostgreSQL + MinIO)
.\docker\scripts\docker-manager.ps1 -mode full

# С полной очисткой Docker (если возникли проблемы)
.\docker\scripts\docker-manager.ps1 -mode full -clean
```

### Локальная разработка

Для локальной разработки можно запустить только PostgreSQL и MinIO в Docker, а сервер запускать локально:

```bash
# В корневой директории проекта
docker-compose up -d postgres minio

# В директории server
npm install
npm run dev
```

Или с использованием скрипта (для Windows):

```powershell
# Запуск PostgreSQL и MinIO для локальной разработки
.\docker\scripts\docker-manager.ps1 -mode dev -host localhost
npm run dev
```

## Переменные окружения

Сервер использует следующие переменные окружения (создаются автоматически или можно настроить вручную в файле `.env`):

```
PORT=3000                      # Порт для запуска сервера
DB_USER=postgres               # Пользователь PostgreSQL
DB_PASSWORD=0000               # Пароль PostgreSQL (по умолчанию '0000')
DB_HOST=localhost              # Хост PostgreSQL (postgres для Docker, localhost для локальной разработки)
DB_PORT=5432                   # Порт PostgreSQL
DB_NAME=models3d               # Имя базы данных
JWT_SECRET=your_secret_key     # Секретный ключ для JWT токенов
USE_MINIO=true                 # Использовать MinIO для хранения файлов
MINIO_ENDPOINT=localhost       # Хост MinIO (minio для Docker, localhost для локальной разработки)
MINIO_PORT=9000                # Порт MinIO
MINIO_ACCESS_KEY=minioadmin    # Ключ доступа MinIO (по умолчанию 'minioadmin')
MINIO_SECRET_KEY=minioadmin    # Секретный ключ MinIO (по умолчанию 'minioadmin')
MINIO_BUCKET_NAME=models3d     # Имя бакета для хранения моделей
MINIO_USE_SSL=false            # Использовать SSL для подключения к MinIO
```

## Хранение файлов

Приложение поддерживает два режима хранения файлов:

1. **MinIO (рекомендуется)** - объектное хранилище, совместимое с Amazon S3, используется по умолчанию
2. **Локальная файловая система** - альтернативный вариант для разработки

Режим хранения определяется переменной `USE_MINIO` в конфигурации. Для переключения между режимами измените параметр `useMinIO` в файле `config.ts`.

### Преимущества использования MinIO

- **Масштабируемость**: легко увеличивать объем хранилища
- **Отказоустойчивость**: возможность настройки репликации
- **Производительность**: оптимизировано для работы с большими файлами
- **Гибкость**: совместимость с S3 API позволяет в будущем мигрировать в облако
- **Разделение ответственности**: отделение логики хранения от бизнес-логики приложения

### Структура бакетов MinIO

- `models3d` - бакет по умолчанию для хранения всех файлов (3D модели и миниатюры)

### Миграция существующих данных

Для миграции существующих 3D-моделей из файловой системы в MinIO используйте скрипт:

```bash
npm run migrate-to-minio
```

### Мониторинг и администрирование

MinIO предоставляет веб-интерфейс для администрирования по адресу:
```
http://localhost:9001
```

Логин и пароль по умолчанию:
- Username: minioadmin
- Password: minioadmin

### Дополнительные возможности MinIO

- **Версионирование файлов**: MinIO поддерживает версионирование объектов
- **Политики доступа**: возможность настройки детальных политик доступа
- **Lifecycle management**: автоматическое удаление устаревших файлов
- **Encryption**: шифрование данных на стороне сервера
- **Event notifications**: события при изменении объектов

### Масштабирование в будущем

Так как MinIO имеет API, совместимое с Amazon S3, в будущем можно легко мигрировать в облачные хранилища:
- Amazon S3
- Google Cloud Storage
- Azure Blob Storage

## API Endpoints

Все API-эндпоинты используют формат JSON для передачи данных, за исключением загрузки файлов, где используется multipart/form-data.

### Базовый URL

```
http://localhost:3000/api
```

### Аутентификация

Все защищенные эндпоинты требуют авторизации через JWT токен, который передается в заголовке:

```
Authorization: Bearer <token>
```

#### Регистрация пользователя

```
POST /auth/register
```

**Тело запроса:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "username"
}
```

**Успешный ответ (201 Created):**
```json
{
  "message": "Пользователь успешно зарегистрирован",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Ошибки:**
- 400 Bad Request: Некорректный формат данных или пользователь уже существует
- 500 Internal Server Error: Внутренняя ошибка сервера

#### Авторизация пользователя

```
POST /auth/login
```

**Тело запроса:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Успешный ответ (200 OK):**
```json
{
  "message": "Успешный вход",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Ошибки:**
- 401 Unauthorized: Неверные учетные данные
- 500 Internal Server Error: Внутренняя ошибка сервера

#### Получение профиля пользователя

```
GET /auth/profile
```

**Заголовки:**
```
Authorization: Bearer <token>
```

**Успешный ответ (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "username"
}
```

**Ошибки:**
- 401 Unauthorized: Токен не предоставлен или недействителен
- 404 Not Found: Пользователь не найден
- 500 Internal Server Error: Внутренняя ошибка сервера

### Работа с 3D-моделями

#### Получение списка моделей

```
GET /models?page=1&limit=10
```

**Параметры запроса:**
- `page` (опционально): Номер страницы, по умолчанию 1
- `limit` (опционально): Количество моделей на странице, по умолчанию 10

**Успешный ответ (200 OK):**
```json
{
  "models": [
    {
      "id": 1,
      "title": "Название модели",
      "description": "Описание модели",
      "fileName": "model.glb",
      "fileUrl": "http://localhost:9000/models3d/model.glb",
      "thumbnailUrl": "http://localhost:9000/models3d/model-thumb.png",
      "userId": 1,
      "tags": ["тег1", "тег2"]
    },
    // ...
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

**Ошибки:**
- 500 Internal Server Error: Внутренняя ошибка сервера

#### Получение конкретной модели

```
GET /models/:id
```

**Успешный ответ (200 OK):**
```json
{
  "id": 1,
  "title": "Название модели",
  "description": "Описание модели",
  "fileName": "model.glb",
  "fileUrl": "http://localhost:9000/models3d/model.glb",
  "thumbnailUrl": "http://localhost:9000/models3d/model-thumb.png",
  "userId": 1,
  "tags": ["тег1", "тег2"]
}
```

**Ошибки:**
- 404 Not Found: Модель не найдена
- 500 Internal Server Error: Внутренняя ошибка сервера

#### Поиск моделей

```
GET /models/search?query=название&tag=тег
```

**Параметры запроса:**
- `query` (опционально): Строка для поиска в названии и описании
- `tag` (опционально): Поиск по тегу

**Успешный ответ (200 OK):**
```json
[
  {
    "id": 1,
    "title": "Название модели",
    "description": "Описание модели",
    "fileName": "model.glb",
    "fileUrl": "http://localhost:9000/models3d/model.glb",
    "thumbnailUrl": "http://localhost:9000/models3d/model-thumb.png",
    "userId": 1,
    "tags": ["тег1", "тег2"]
  },
  // ...
]
```

**Ошибки:**
- 500 Internal Server Error: Внутренняя ошибка сервера

#### Получение топ-рейтинговых моделей

```
GET /models/top-rated?limit=5
```

**Параметры запроса:**
- `limit` (опционально): Количество моделей, по умолчанию 10

**Успешный ответ (200 OK):**
```json
[
  {
    "id": 1,
    "title": "Название модели",
    "description": "Описание модели",
    "fileName": "model.glb",
    "fileUrl": "http://localhost:9000/models3d/model.glb",
    "thumbnailUrl": "http://localhost:9000/models3d/model-thumb.png",
    "userId": 1,
    "tags": ["тег1", "тег2"],
    "rating": 4.8
  },
  // ...
]
```

**Ошибки:**
- 500 Internal Server Error: Внутренняя ошибка сервера

#### Загрузка новой модели

```
POST /models
```

**Заголовки:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Параметры формы:**
- `model` (обязательный): Файл 3D-модели (.glb, .gltf, .obj, .stl, .fbx)
- `title` (обязательный): Название модели
- `description` (обязательный): Описание модели
- `tags` (опционально): JSON-строка с массивом тегов, например: `["тег1", "тег2"]`

**Успешный ответ (201 Created):**
```json
{
  "id": 1,
  "title": "Название модели",
  "description": "Описание модели",
  "fileName": "model.glb",
  "fileUrl": "http://localhost:9000/models3d/model.glb",
  "thumbnailUrl": "http://localhost:9000/models3d/model-thumb.png",
  "userId": 1,
  "tags": ["тег1", "тег2"]
}
```

**Ошибки:**
- 400 Bad Request: Отсутствует файл или некорректные данные
- 401 Unauthorized: Пользователь не авторизован
- 500 Internal Server Error: Внутренняя ошибка сервера

#### Обновление информации о модели

```
PUT /models/:id
```

**Заголовки:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Тело запроса:**
```json
{
  "title": "Обновленное название",
  "description": "Обновленное описание",
  "tags": ["новый_тег1", "новый_тег2"]
}
```

**Успешный ответ (200 OK):**
```json
{
  "id": 1,
  "title": "Обновленное название",
  "description": "Обновленное описание",
  "fileName": "model.glb",
  "fileUrl": "http://localhost:9000/models3d/model.glb",
  "thumbnailUrl": "http://localhost:9000/models3d/model-thumb.png",
  "userId": 1,
  "tags": ["новый_тег1", "новый_тег2"]
}
```

**Ошибки:**
- 401 Unauthorized: Пользователь не авторизован
- 403 Forbidden: Нет прав на редактирование модели
- 404 Not Found: Модель не найдена
- 500 Internal Server Error: Внутренняя ошибка сервера

#### Удаление модели

```
DELETE /models/:id
```

**Заголовки:**
```
Authorization: Bearer <token>
```

**Успешный ответ (200 OK):**
```json
{
  "message": "Модель успешно удалена"
}
```

**Ошибки:**
- 401 Unauthorized: Пользователь не авторизован
- 403 Forbidden: Нет прав на удаление модели
- 404 Not Found: Модель не найдена
- 500 Internal Server Error: Внутренняя ошибка сервера

#### Оценка модели

```
POST /models/:id/rate
```

**Заголовки:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Тело запроса:**
```json
{
  "value": 5
}
```

**Успешный ответ (200 OK):**
```json
{
  "userId": 1,
  "modelId": 1,
  "value": 5
}
```

**Ошибки:**
- 400 Bad Request: Неверное значение оценки (должно быть от 1 до 5)
- 401 Unauthorized: Пользователь не авторизован
- 404 Not Found: Модель не найдена
- 500 Internal Server Error: Внутренняя ошибка сервера

### Коды и сообщения об ошибках

| Код | Описание | Возможная причина |
|-----|----------|-------------------|
| 400 | Bad Request | Некорректные данные в запросе |
| 401 | Unauthorized | Отсутствует токен или он недействителен |
| 403 | Forbidden | Нет прав на выполнение операции |
| 404 | Not Found | Запрашиваемый ресурс не найден |
| 500 | Internal Server Error | Внутренняя ошибка сервера |

### Формат сообщений об ошибках

```json
{
  "error": "Описание ошибки"
}
```

или для ошибок валидации:

```json
{
  "errors": [
    {
      "msg": "Описание ошибки 1"
    },
    {
      "msg": "Описание ошибки 2"
    }
  ]
}
```

## База данных

Приложение использует PostgreSQL в качестве основной базы данных. При первом запуске база данных инициализируется автоматически с созданием необходимых таблиц:

- `users` - пользователи системы
- `models` - 3D-модели
- `ratings` - оценки моделей пользователями

### Наполнение базы тестовыми данными

Для разработки и тестирования вы можете наполнить базу данных тестовыми моделями с помощью следующей SQL-команды:

```sql
WITH new_user AS (
  INSERT INTO users (email, password, username) 
  VALUES ('test@example.com', '$2a$10$9KvnQrT0b2LKbKwh.RJ3Vee5WGLBZDqZRQPOYQpGWQvOl5DuCMGc2', 'testuser')
  RETURNING id
)
INSERT INTO models (title, description, file_name, file_url, thumbnail_url, user_id, tags)
SELECT 
  title, description, file_name, file_url, thumbnail_url, (SELECT id FROM new_user), tags
FROM (
  VALUES 
    ('Модель стола', 'Современный дизайнерский стол', 'table.glb', '/uploads/table.glb', '/thumbnails/table.png', ARRAY['мебель', 'интерьер']),
    ('Ваза для цветов', 'Декоративная ваза в минималистичном стиле', 'vase.glb', '/uploads/vase.glb', '/thumbnails/vase.png', ARRAY['декор', 'интерьер']),
    ('Модель дома', 'Современный загородный дом', 'house.glb', '/uploads/house.glb', '/thumbnails/house.png', ARRAY['архитектура', 'дом']),
    ('Кресло в стиле лофт', 'Удобное кресло в лофт стиле', 'chair.glb', '/uploads/chair.glb', '/thumbnails/chair.png', ARRAY['мебель', 'лофт']),
    ('Настольная лампа', 'Светодиодная лампа для рабочего стола', 'lamp.glb', '/uploads/lamp.glb', '/thumbnails/lamp.png', ARRAY['освещение', 'интерьер'])
) AS t(title, description, file_name, file_url, thumbnail_url, tags);
```

Эта команда:
1. Создает тестового пользователя с email `test@example.com` и паролем `password123` (предварительно хешированный)
2. Добавляет 5 тестовых 3D-моделей с разными параметрами
3. Связывает все модели с созданным пользователем

Запустить SQL-команду можно через psql или через интерфейс PgAdmin.

## Тестирование

В проекте реализованы автоматические тесты с использованием Jest и SuperTest. Тесты работают с реальной базой данных PostgreSQL и используют моки для хранилища файлов.

### Настройка тестовой базы данных

Перед запуском тестов необходимо:

1. Убедиться, что PostgreSQL запущен и доступен
2. Проверить настройки подключения в файле `config.ts` 
3. Запустить скрипт создания тестовой базы данных:

```bash
# Создание тестовой базы данных
npm run create-test-db
```

### Запуск тестов

```bash
# Запуск всех тестов
npm test

# Запуск тестов в режиме watch
npm run test:watch

# Запуск тестов с отчетом о покрытии
npm run test:coverage

# Запуск тестов последовательно
npm run test:sequential

# Запуск отдельного тестового файла
npm test -- src/tests/auth.test.ts
```

Тестовая база данных очищается после каждого теста, чтобы обеспечить изолированное окружение. Для тестов используется мок-сервис хранилища, что позволяет тестировать API без реального MinIO.

## Разработка

```bash
# Компиляция TypeScript
npm run build

# Запуск сервера в режиме разработки (с автоматической перезагрузкой)
npm run dev

# Запуск скомпилированной версии
npm start

# Инициализация MinIO
npm run init-minio

# Миграция файлов в MinIO
npm run migrate-to-minio
```

## Устранение неполадок

### Проблемы с базой данных

1. Убедитесь, что сервер PostgreSQL запущен
2. Проверьте, что пользователь 'postgres' существует и имеет пароль, соответствующий указанному в `config.ts` (по умолчанию '0000')
3. При проблемах с доступом, проверьте настройки аутентификации в PostgreSQL (файл pg_hba.conf)
4. Для локального подключения может потребоваться метод аутентификации MD5 или trust

### Проблемы с MinIO

1. Убедитесь, что сервер MinIO запущен и доступен
2. Проверьте, что указанные ключи доступа (access key и secret key) верны
3. Бакет `models3d` должен существовать, он создается автоматически при первом запуске
4. Для локальной разработки вы можете отключить MinIO, установив `useMinIO: false` в `config.ts`

### Проблемы с тестами

- Тесты используют отдельную тестовую базу данных `models3d_test`, которая должна быть создана перед запуском тестов
- Для устранения конфликтов доступа к БД используйте последовательный режим запуска тестов:
  ```bash
  npm run test:sequential
  ```
- Если тесты не могут подключиться к базе данных, проверьте журналы ошибок на наличие сообщений об аутентификации

## Поддержка и документация

- [Официальная документация MinIO](https://docs.min.io/)
- [MinIO JavaScript SDK](https://docs.min.io/docs/javascript-client-api-reference.html)
- [Docker Hub MinIO](https://hub.docker.com/r/minio/minio/)