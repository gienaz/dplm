import request from 'supertest';
import app from '../app';
import { db } from '../data/postgresDb';
import { createTestUser, createTestModel, createTestRating } from './testUtils';
import { storageService } from '../data/storageService';

// Мокаем сервис хранения, чтобы тесты не зависели от реальной файловой системы или MinIO
jest.mock('../data/storageService', () => {
  return {
    storageService: {
      uploadFile: jest.fn().mockImplementation((_buffer, filename) => {
        return Promise.resolve(`/mock-uploads/${filename}`);
      }),
      uploadFileFromPath: jest.fn().mockImplementation((_filepath, filename) => {
        return Promise.resolve(`/mock-uploads/${filename}`);
      }),
      getFileUrl: jest.fn().mockImplementation((filename) => {
        return `/mock-uploads/${filename}`;
      }),
      deleteFile: jest.fn().mockResolvedValue(undefined)
    }
  };
});

describe('Models API', () => {
  let testUser: any;
  let testModel: any;
  let anotherTestUser: any; // Для тестов с разными пользователями
  
  beforeEach(async () => {
    // Создаем тестового пользователя и модель для каждого теста
    testUser = await createTestUser();
    testModel = await createTestModel(testUser.id);
    
    // Создаем второго пользователя с другим email
    const hashedPassword = await require('bcryptjs').hash('password123', 10);
    anotherTestUser = await db.createUser(
      `another${Date.now()}@example.com`, // Уникальный email для каждого теста
      hashedPassword,
      'anotheruser'
    );
    anotherTestUser.token = require('../middleware/auth').generateToken(anotherTestUser.id, anotherTestUser.email);
    
    // Очищаем историю вызовов mock-функций
    jest.clearAllMocks();
  });

  describe('GET /api/models', () => {
    it('должен возвращать список моделей с пагинацией', async () => {
      // Создаем несколько дополнительных моделей
      await createTestModel(testUser.id);
      await createTestModel(testUser.id);
      
      const response = await request(app)
        .get('/api/models?page=1&limit=2')
        .expect(200);
      
      expect(response.body).toHaveProperty('models');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.models).toBeInstanceOf(Array);
      expect(response.body.models.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 2);
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('totalPages');
    });
  });
  
  describe('GET /api/models/:id', () => {
    it('должен возвращать модель по ID', async () => {
      const response = await request(app)
        .get(`/api/models/${testModel.id}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('id', testModel.id);
      expect(response.body).toHaveProperty('title', testModel.title);
      expect(response.body).toHaveProperty('description', testModel.description);
      expect(response.body).toHaveProperty('userId', testUser.id);
    });
    
    it('должен возвращать 404 для несуществующей модели', async () => {
      const response = await request(app)
        .get('/api/models/99999')
        .expect(404);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Модель не найдена');
    });
  });
  
  describe('GET /api/models/search', () => {
    it('должен искать модели по заголовку', async () => {
      // Создаем модель с особым заголовком для поиска
      await db.createModel({
        title: 'Уникальный заголовок для поиска',
        description: 'Описание',
        fileName: 'test.glb',
        fileUrl: '/mock-uploads/test.glb',
        thumbnailUrl: '/thumbnails/default.png',
        userId: testUser.id,
        tags: ['тест']
      });
      
      // Кодируем параметры поиска для URL
      const query = encodeURIComponent('уникальный');
      
      const response = await request(app)
        .get(`/api/models/search?query=${query}`)
        .expect(200);
      
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0].title).toContain('Уникальный');
    });
    
    it('должен искать модели по тегу', async () => {
      // Создаем модель с особым тегом для поиска
      await db.createModel({
        title: 'Модель с тегом',
        description: 'Описание',
        fileName: 'test.glb',
        fileUrl: '/mock-uploads/test.glb',
        thumbnailUrl: '/thumbnails/default.png',
        userId: testUser.id,
        tags: ['уникальный_тег']
      });
      
      // Кодируем параметры поиска для URL
      const tag = encodeURIComponent('уникальный_тег');
      
      const response = await request(app)
        .get(`/api/models/search?tag=${tag}`)
        .expect(200);
      
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0].tags).toContain('уникальный_тег');
    });
  });
  
  describe('GET /api/models/top-rated', () => {
    it('должен возвращать топ-рейтинговые модели', async () => {
      // Создаем еще одну модель
      const model2 = await createTestModel(testUser.id);
      
      // Оцениваем модели
      await createTestRating(testUser.id, testModel.id, 3);
      await createTestRating(testUser.id, model2.id, 5);
      
      const response = await request(app)
        .get('/api/models/top-rated?limit=2')
        .expect(200);
      
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0]).toHaveProperty('rating');
      
      // Проверяем, что модели отсортированы по рейтингу (от высшего к низшему)
      if (response.body.length > 1) {
        expect(parseFloat(response.body[0].rating)).toBeGreaterThanOrEqual(parseFloat(response.body[1].rating));
      }
    });
  });
  
  describe('POST /api/models', () => {
    it('должен загружать новую модель', async () => {
      // Создаем тестовый буфер для имитации файла
      const testBuffer = Buffer.from('test model content');
      
      // Тестируем загрузку модели
      const response = await request(app)
        .post('/api/models')
        .set('Authorization', `Bearer ${testUser.token}`)
        .field('title', 'Новая модель')
        .field('description', 'Описание новой модели')
        .field('tags', JSON.stringify(['новая', 'тест']))
        .attach('model', testBuffer, 'test-upload.glb')
        .expect(201);
      
      // Проверяем, что функция загрузки файла была вызвана
      expect(storageService.uploadFile).toHaveBeenCalled();
      
      // Проверяем ответ
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', 'Новая модель');
      expect(response.body).toHaveProperty('description', 'Описание новой модели');
      expect(response.body).toHaveProperty('userId', testUser.id);
      expect(response.body.tags).toEqual(expect.arrayContaining(['новая', 'тест']));
      expect(response.body).toHaveProperty('fileUrl');
      expect(response.body.fileUrl).toContain('/mock-uploads/');
    });
    
    it('должен возвращать ошибку при отсутствии файла', async () => {
      const response = await request(app)
        .post('/api/models')
        .set('Authorization', `Bearer ${testUser.token}`)
        .field('title', 'Модель без файла')
        .field('description', 'Описание')
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Файл модели не загружен');
    });
  });
  
  describe('PUT /api/models/:id', () => {
    it('должен обновлять модель при наличии прав', async () => {
      const updateData = {
        title: 'Обновленный заголовок',
        description: 'Обновленное описание',
        tags: ['обновлено', '3d']
      };
      
      const response = await request(app)
        .put(`/api/models/${testModel.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body).toHaveProperty('id', testModel.id);
      expect(response.body).toHaveProperty('title', updateData.title);
      expect(response.body).toHaveProperty('description', updateData.description);
      expect(response.body.tags).toEqual(expect.arrayContaining(updateData.tags));
    });
    
    it('должен возвращать 403 при попытке обновить чужую модель', async () => {
      const updateData = { title: 'Попытка обновления' };
      
      const response = await request(app)
        .put(`/api/models/${testModel.id}`)
        .set('Authorization', `Bearer ${anotherTestUser.token}`)
        .send(updateData)
        .expect(403);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Нет прав на редактирование');
    });
  });
  
  describe('DELETE /api/models/:id', () => {
    it('должен удалять модель при наличии прав', async () => {
      const response = await request(app)
        .delete(`/api/models/${testModel.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);
      
      // Проверяем, что был вызов deleteFile
      expect(storageService.deleteFile).toHaveBeenCalledWith(testModel.fileName);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('успешно удалена');
      
      // Проверяем, что модель действительно удалена
      const deletedModel = await db.getModelById(testModel.id);
      expect(deletedModel).toBeNull();
    });
    
    it('должен возвращать 403 при попытке удалить чужую модель', async () => {
      const response = await request(app)
        .delete(`/api/models/${testModel.id}`)
        .set('Authorization', `Bearer ${anotherTestUser.token}`)
        .expect(403);
      
      // Проверяем, что deleteFile НЕ был вызван
      expect(storageService.deleteFile).not.toHaveBeenCalled();
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Нет прав на удаление');
    });
  });
  
  describe('POST /api/models/:id/rate', () => {
    it('должен позволять пользователю оценить модель', async () => {
      const response = await request(app)
        .post(`/api/models/${testModel.id}/rate`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ value: 4 })
        .expect(200);
      
      expect(response.body).toHaveProperty('userId', testUser.id);
      expect(response.body).toHaveProperty('modelId', testModel.id);
      expect(response.body).toHaveProperty('value', 4);
    });
    
    it('должен возвращать ошибку при неверном значении оценки', async () => {
      const response = await request(app)
        .post(`/api/models/${testModel.id}/rate`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ value: 10 }) // Недопустимое значение
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Оценка должна быть числом от 1 до 5');
    });
  });
}); 