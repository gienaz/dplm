import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { ErrorResponse } from './types';

// Маршруты
import modelRoutes from './routes/models';
import authRoutes from './routes/auth';

const app: Express = express();

// Промежуточное ПО (Middleware)
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Убедимся, что директория uploads существует
const uploadsDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// Маршруты
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Добро пожаловать в API 3D Моделей' });
});

// API Маршруты
app.use('/api/auth', authRoutes);
app.use('/api/models', modelRoutes);

// Обработчик ошибок
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  const errorResponse: ErrorResponse = {
    message: err.message || 'Что-то пошло не так!'
  };
  res.status(500).json(errorResponse);
});

export default app; 