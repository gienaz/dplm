import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import modelRoutes from './routes/models';

export async function createServer() {
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

  return app;
}

// Создаем экземпляр приложения для тестов
const app = express();
const setupServerProperties = () => {
  const tempApp = express();
  
  // Копируем все middleware и маршруты
  tempApp.use(cors());
  tempApp.use(express.json());
  tempApp.use(express.urlencoded({ extended: true }));
  
  tempApp.use('/uploads', express.static(path.join(__dirname, '../uploads')));
  tempApp.use('/thumbnails', express.static(path.join(__dirname, '../thumbnails')));
  
  tempApp.get('/', (_req, res) => {
    res.json({ message: 'API 3D моделей работает' });
  });
  
  tempApp.use('/api/auth', authRoutes);
  tempApp.use('/api/models', modelRoutes);
  
  tempApp.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Что-то пошло не так!' });
  });
  
  return tempApp;
};

// Настраиваем app синхронно для тестирования
Object.assign(app, setupServerProperties());

export default app; 