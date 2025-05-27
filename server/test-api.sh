#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# URL API
API_URL="http://localhost:3000"

echo -e "${GREEN}Тестирование API 3D моделей${NC}\n"

# 1. Проверка корневого эндпоинта
echo -e "${GREEN}1. Тестирование корневого эндпоинта:${NC}"
curl -X GET "${API_URL}/"
echo -e "\n"

# 2. Получение всех моделей
echo -e "${GREEN}2. Получение списка всех моделей:${NC}"
curl -X GET "${API_URL}/api/models"
echo -e "\n"

# 3. Получение моделей с пагинацией
echo -e "${GREEN}3. Получение моделей с пагинацией:${NC}"
curl -X GET "${API_URL}/api/models?page=1&limit=10"
echo -e "\n"

# 4. Получение моделей с фильтрацией по тегу
echo -e "${GREEN}4. Получение моделей с фильтром по тегу:${NC}"
curl -X GET "${API_URL}/api/models?tag=test"
echo -e "\n"

# 5. Загрузка новой модели
echo -e "${GREEN}5. Загрузка новой модели:${NC}"
curl -X POST "${API_URL}/api/models" \
  -H "Content-Type: multipart/form-data" \
  -F "title=Тестовая модель" \
  -F "description=Описание тестовой модели" \
  -F "tags=[\"test\", \"cube\"]" \
  -F "model=@uploads/test.stl"
echo -e "\n"

# 6. Получение конкретной модели
echo -e "${GREEN}6. Получение модели по ID:${NC}"
curl -X GET "${API_URL}/api/models/1"
echo -e "\n"

# 7. Лайк модели
echo -e "${GREEN}7. Лайк модели:${NC}"
curl -X POST "${API_URL}/api/models/1/like"
echo -e "\n"

# 8. Скачивание модели
echo -e "${GREEN}8. Скачивание модели:${NC}"
curl -X GET "${API_URL}/api/models/1/download" --output "downloaded_model.stl"
echo -e "\n"

# 9. Получение отсортированных моделей
echo -e "${GREEN}9. Получение моделей, отсортированных по лайкам:${NC}"
curl -X GET "${API_URL}/api/models?sort=likes"
echo -e "\n"

# Ожидание ввода пользователя перед закрытием
echo -e "${GREEN}Нажмите Enter для завершения...${NC}"
read 