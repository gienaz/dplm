import { Request } from 'express';
import path from 'path';

// Мок для файла
export const mockFile = {
  fieldname: 'model',
  originalname: 'test-model.glb',
  encoding: '7bit',
  mimetype: 'model/gltf-binary',
  destination: path.join(__dirname, '../../uploads'),
  filename: 'test-model-123456.glb',
  path: path.join(__dirname, '../../uploads/test-model-123456.glb'),
  size: 12345
};

// Мок для мультипарт-запроса с файлом
export const mockFileRequest = (userId: number) => {
  const req = {
    user: { id: userId, email: 'test@example.com' },
    file: mockFile,
    body: {
      title: 'Тестовая модель',
      description: 'Описание тестовой модели',
      tags: JSON.stringify(['тест', '3d'])
    }
  } as unknown as Request;
  
  return req;
}; 