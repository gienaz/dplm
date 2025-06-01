import { db } from '../data/postgresDb';
import { User, Model3D } from '../types';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth';

// Создание тестового пользователя
export const createTestUser = async (): Promise<User & { token: string }> => {
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await db.createUser(
    'test@example.com',
    hashedPassword,
    'testuser'
  );
  
  const token = generateToken(user.id, user.email);
  
  return { 
    ...user, 
    token,
    password: password // Возвращаем чистый пароль для тестов
  };
};

// Создание тестовой 3D модели
export const createTestModel = async (userId: number): Promise<Model3D> => {
  const model = await db.createModel({
    title: 'Тестовая модель',
    description: 'Описание тестовой модели',
    fileName: 'test-model.glb',
    fileUrl: '/uploads/test-model.glb',
    thumbnailUrl: '/thumbnails/default.png',
    userId,
    tags: ['тест', '3d']
  });
  
  return model;
};

// Функция для создания рейтинга
export const createTestRating = async (userId: number, modelId: number, value: number = 5): Promise<void> => {
  await db.rateModel(userId, modelId, value);
}; 