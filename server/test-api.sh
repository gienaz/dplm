#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# URL API
API_URL="http://localhost:3000"

# Временные переменные для хранения токенов
USER_TOKEN=""
ADMIN_TOKEN=""

echo -e "${GREEN}Тестирование API 3D моделей${NC}\n"

# 1. Проверка корневого эндпоинта
echo -e "${GREEN}1. Тестирование корневого эндпоинта:${NC}"
curl -X GET "${API_URL}/"
echo -e "\n"

# 2. Регистрация нового пользователя
echo -e "${GREEN}2. Регистрация нового пользователя:${NC}"
USER_RESPONSE=$(curl -X POST "${API_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }')
echo $USER_RESPONSE
USER_TOKEN=$(echo $USER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo -e "\n"

# 3. Попытка повторной регистрации (должна вернуть ошибку)
echo -e "${GREEN}3. Попытка повторной регистрации с тем же email:${NC}"
curl -X POST "${API_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
echo -e "\n"

# 4. Вход существующего пользователя (admin)
echo -e "${GREEN}4. Вход администратора:${NC}"
ADMIN_RESPONSE=$(curl -X POST "${API_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }')
echo $ADMIN_RESPONSE
ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo -e "\n"

# 5. Получение списка моделей (без авторизации)
echo -e "${GREEN}5. Получение списка моделей (без авторизации):${NC}"
curl -X GET "${API_URL}/api/models"
echo -e "\n"

# 6. Загрузка модели без авторизации (должна вернуть ошибку)
echo -e "${GREEN}6. Попытка загрузки модели без авторизации:${NC}"
curl -X POST "${API_URL}/api/models" \
  -F "title=Тестовая модель" \
  -F "description=Описание тестовой модели" \
  -F "tags=[\"test\", \"cube\"]" \
  -F "model=@uploads/test.stl"
echo -e "\n"

# 7. Загрузка модели с авторизацией пользователя
echo -e "${GREEN}7. Загрузка модели с авторизацией пользователя:${NC}"
curl -X POST "${API_URL}/api/models" \
  -H "Authorization: Bearer ${USER_TOKEN}" \
  -F "title=Тестовая модель" \
  -F "description=Описание тестовой модели" \
  -F "tags=[\"test\", \"cube\"]" \
  -F "model=@uploads/test.stl"
echo -e "\n"

# 8. Получение конкретной модели
echo -e "${GREEN}8. Получение модели по ID:${NC}"
curl -X GET "${API_URL}/api/models/1"
echo -e "\n"

# 9. Лайк модели с авторизацией
echo -e "${GREEN}9. Лайк модели с авторизацией:${NC}"
curl -X POST "${API_URL}/api/models/1/like" \
  -H "Authorization: Bearer ${USER_TOKEN}"
echo -e "\n"

# 10. Скачивание модели с авторизацией
echo -e "${GREEN}10. Скачивание модели с авторизацией:${NC}"
curl -X GET "${API_URL}/api/models/1/download" \
  -H "Authorization: Bearer ${USER_TOKEN}" \
  --output "downloaded_model.stl"
echo -e "\n"

# 11. Попытка удаления модели пользователем (должна вернуть ошибку)
echo -e "${GREEN}11. Попытка удаления модели обычным пользователем:${NC}"
curl -X DELETE "${API_URL}/api/models/1" \
  -H "Authorization: Bearer ${USER_TOKEN}"
echo -e "\n"

# 12. Удаление модели администратором
echo -e "${GREEN}12. Удаление модели администратором:${NC}"
curl -X DELETE "${API_URL}/api/models/1" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
echo -e "\n"

# 13. Получение отсортированных моделей
echo -e "${GREEN}13. Получение моделей, отсортированных по лайкам:${NC}"
curl -X GET "${API_URL}/api/models?sort=likes"
echo -e "\n"

# 14. Попытка входа с неверными данными
echo -e "${GREEN}14. Попытка входа с неверными данными:${NC}"
curl -X POST "${API_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "wrong@example.com",
    "password": "wrongpassword"
  }'
echo -e "\n"

echo -e "${GREEN}Тестирование завершено!${NC}"
echo -e "${GREEN}Нажмите Enter для завершения...${NC}"
read 