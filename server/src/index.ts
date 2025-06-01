import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { createServer } from './app';
import { db } from './data/postgresDb';
import initMinIO from './scripts/init-minio';
import config from '../config';

import authRoutes from './routes/auth';
import modelRoutes from './routes/models';

// Загрузка переменных окружения
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/thumbnails', express.static(path.join(__dirname, '../thumbnails')));

// Routes
app.get('/', (_req, res) => {
  res.json({ message: 'API 3D моделей работает' });
});

app.use('/api/auth', authRoutes);
app.use('/api/models', modelRoutes);

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Что-то пошло не так!' });
});

async function startServer() {
  try {
    // Инициализация базы данных
    console.log('Инициализация базы данных...');
    await db.initDatabase();
    console.log('База данных успешно инициализирована');
    
    // Инициализация MinIO если включено
    if (config.useMinIO) {
      console.log('Инициализация MinIO...');
      try {
        await initMinIO();
        console.log('MinIO успешно инициализирован');
      } catch (error) {
        console.error('Ошибка инициализации MinIO:', error);
        console.log('Продолжаем запуск сервера без MinIO');
      }
    }
    
    const app = await createServer();
    const PORT = process.env.PORT || 3000;
    
    app.listen(PORT, () => {
      console.log(`Сервер запущен на порту ${PORT}`);
      console.log(`Режим хранения файлов: ${config.useMinIO ? 'MinIO' : 'Локальная файловая система'}`);
    });
  } catch (error) {
    console.error('Ошибка при запуске сервера:', error);
    process.exit(1);
  }
}

startServer().catch(console.error); 