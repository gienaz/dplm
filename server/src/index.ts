import dotenv from 'dotenv';
import app from './app';

// Загрузка переменных окружения
dotenv.config();

// Определение порта
const PORT: number = parseInt(process.env.PORT || '3000', 10);

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
}); 