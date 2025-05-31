import dotenv from 'dotenv';
import path from 'path';

// Загрузка тестовых переменных окружения
dotenv.config({ path: path.join(__dirname, '../.env.test') });

// Глобальные настройки для тестов
process.env.JWT_SECRET = 'test-secret-key';
process.env.PORT = '3001'; // Используем другой порт для тестов 