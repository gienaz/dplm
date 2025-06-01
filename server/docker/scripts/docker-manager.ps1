# PowerShell скрипт для управления Docker

param (
    [string]$mode = "full",  # Режим: "full" (полный запуск) или "dev" (только БД)
    [switch]$clean = $false, # Флаг для полной очистки Docker
    [string]$host = "postgres" # Хост БД: "postgres" (для Docker) или "localhost" (для локальной разработки)
)

# Переходим в корневую директорию проекта
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
cd (Join-Path (Join-Path $scriptPath "../..") "..")

# Остановка и удаление существующих контейнеров
Write-Host "Остановка и удаление существующих контейнеров..." -ForegroundColor Yellow
docker-compose down

# Если указан флаг очистки
if ($clean) {
    Write-Host "Очистка Docker ресурсов..." -ForegroundColor Yellow
    docker rmi dplm-server -f
    docker rmi models3d-server -f
    docker system prune -f
}

# Создание .env файла с правильной кодировкой
$envPath = "server/.env"
$envContent = @"
PORT=3000
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=models3d
POSTGRES_HOST=$host
POSTGRES_PORT=5432
JWT_SECRET=your_jwt_secret_key_here
"@

# Удаляем существующий файл .env, если он существует
if (Test-Path $envPath) {
    Write-Host "Удаление существующего .env файла..." -ForegroundColor Yellow
    Remove-Item -Path $envPath -Force
}

# Создаем новый .env файл с правильной кодировкой UTF-8
Write-Host "Создание нового .env файла с кодировкой UTF-8..." -ForegroundColor Green
Set-Content -Path $envPath -Value $envContent -Encoding UTF8

# Выбор режима запуска
if ($mode -eq "full") {
    # Полный запуск (сервер + БД)
    Write-Host "Запуск полного стека (сервер + БД)..." -ForegroundColor Green
    docker-compose up --build -d
    
    # Ожидание запуска сервера
    Write-Host "Ожидание запуска сервера (15 секунд)..." -ForegroundColor Cyan
    Start-Sleep -Seconds 15
    
    # Проверка логов сервера
    Write-Host "Проверка логов сервера..." -ForegroundColor Magenta
    docker logs models3d-server
    
    # Проверка, работает ли сервер
    Write-Host "Тестирование сервера API..." -ForegroundColor Green
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000" -ErrorAction Stop
        $responseJson = $response | ConvertTo-Json
        Write-Host "Ответ сервера: $responseJson" -ForegroundColor Green
    } catch {
        Write-Host "Сервер не отвечает! Ошибка: $_" -ForegroundColor Red
    }
} elseif ($mode -eq "dev") {
    # Запуск только БД для локальной разработки
    Write-Host "Запуск только PostgreSQL для локальной разработки..." -ForegroundColor Cyan
    docker-compose up -d postgres
    
    # Ожидание запуска PostgreSQL
    Write-Host "Ожидание запуска PostgreSQL (5 секунд)..." -ForegroundColor Cyan
    Start-Sleep -Seconds 5
    
    # Проверка, запущен ли PostgreSQL
    Write-Host "Проверка статуса PostgreSQL..." -ForegroundColor Magenta
    docker logs models3d-postgres
    
    # Запуск проверки подключения к БД
    Write-Host "Запуск сервера в режиме разработки..." -ForegroundColor Green
    Write-Host "Выполните следующие команды в новом окне терминала:" -ForegroundColor Yellow
    Write-Host "  cd server" -ForegroundColor White
    Write-Host "  npm run dev" -ForegroundColor White
} else {
    Write-Host "Неизвестный режим: $mode. Допустимые значения: 'full' или 'dev'" -ForegroundColor Red
}

Write-Host "Готово!" -ForegroundColor Green 