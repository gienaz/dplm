import request from 'supertest';
import { Express } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer } from '../src/app';
import { clearDatabase, createTestUser, createTestModel } from './helpers';

let app: Express;
let userToken: string;
let testUserId: number;
let testModelId: number;

beforeAll(async () => {
  app = await createServer();
});

beforeEach(async () => {
  clearDatabase();
  
  // Создаем тестового пользователя и модель
  const { user, token } = await createTestUser();
  userToken = token;
  testUserId = user.id;
  
  const model = await createTestModel(user.id);
  testModelId = model.id;
});

describe('3D Models Endpoints', () => {
  describe('GET /api/models', () => {
    it('should return list of models with pagination', async () => {
      const response = await request(app)
        .get('/api/models')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('models');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.models)).toBe(true);
    });

    it('should return empty list when no models exist', async () => {
      clearDatabase();
      const response = await request(app)
        .get('/api/models');

      expect(response.status).toBe(200);
      expect(response.body.models).toHaveLength(0);
    });
  });

  describe('POST /api/models', () => {
    const testFilePath = path.join(__dirname, 'test-files', 'test.stl');

    beforeAll(() => {
      // Создаем тестовый файл
      if (!fs.existsSync(path.dirname(testFilePath))) {
        fs.mkdirSync(path.dirname(testFilePath), { recursive: true });
      }
      fs.writeFileSync(testFilePath, 'test file content');
    });

    afterAll(() => {
      // Удаляем тестовый файл
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    });

    it('should upload new model with authentication', async () => {
      const response = await request(app)
        .post('/api/models')
        .set('Authorization', `Bearer ${userToken}`)
        .field('title', 'New Test Model')
        .field('description', 'New Test Description')
        .field('tags', JSON.stringify(['new', 'test']))
        .attach('model', testFilePath);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('New Test Model');
    });

    it('should not upload model without authentication', async () => {
      const response = await request(app)
        .post('/api/models')
        .field('title', 'New Test Model')
        .field('description', 'New Test Description')
        .field('tags', JSON.stringify(['new', 'test']))
        .attach('model', testFilePath);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/models/:id', () => {
    it('should return model by id', async () => {
      const response = await request(app)
        .get(`/api/models/${testModelId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testModelId);
      expect(response.body.title).toBe('Test Model');
    });

    it('should return 404 for non-existent model', async () => {
      const response = await request(app)
        .get('/api/models/999');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/models/:id', () => {
    it('should update model with authentication', async () => {
      const response = await request(app)
        .put(`/api/models/${testModelId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Updated Title',
          description: 'Updated Description',
          tags: ['updated', 'test']
        });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Title');
      expect(response.body.description).toBe('Updated Description');
    });

    it('should not update model without authentication', async () => {
      const response = await request(app)
        .put(`/api/models/${testModelId}`)
        .send({
          title: 'Updated Title'
        });

      expect(response.status).toBe(401);
    });

    it('should not update model owned by different user', async () => {
      const { token: anotherUserToken } = await createTestUser('another@example.com');

      const response = await request(app)
        .put(`/api/models/${testModelId}`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .send({
          title: 'Updated Title'
        });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/models/:id', () => {
    it('should delete model with authentication', async () => {
      const response = await request(app)
        .delete(`/api/models/${testModelId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      
      // Проверяем, что модель действительно удалена
      const checkResponse = await request(app)
        .get(`/api/models/${testModelId}`);
      expect(checkResponse.status).toBe(404);
    });

    it('should not delete model without authentication', async () => {
      const response = await request(app)
        .delete(`/api/models/${testModelId}`);

      expect(response.status).toBe(401);
    });

    it('should not delete model owned by different user', async () => {
      const { token: anotherUserToken } = await createTestUser('another@example.com');

      const response = await request(app)
        .delete(`/api/models/${testModelId}`)
        .set('Authorization', `Bearer ${anotherUserToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/models/:id/rate', () => {
    it('should rate model with authentication', async () => {
      const response = await request(app)
        .post(`/api/models/${testModelId}/rate`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ value: 5 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('value', 5);
    });

    it('should update existing rating', async () => {
      // Первая оценка
      await request(app)
        .post(`/api/models/${testModelId}/rate`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ value: 4 });

      // Обновление оценки
      const response = await request(app)
        .post(`/api/models/${testModelId}/rate`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ value: 5 });

      expect(response.status).toBe(200);
      expect(response.body.value).toBe(5);
    });

    it('should validate rating value', async () => {
      const response = await request(app)
        .post(`/api/models/${testModelId}/rate`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ value: 6 }); // Недопустимое значение

      expect(response.status).toBe(400);
    });

    it('should not rate without authentication', async () => {
      const response = await request(app)
        .post(`/api/models/${testModelId}/rate`)
        .send({ value: 5 });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/models/search', () => {
    beforeEach(async () => {
      // Создаем дополнительные модели для тестирования поиска
      await createTestModel(testUserId, 'Awesome Model');
      await createTestModel(testUserId, 'Cool Design');
    });

    it('should search models by query', async () => {
      const response = await request(app)
        .get('/api/models/search')
        .query({ query: 'Awesome' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].title).toBe('Awesome Model');
    });

    it('should search models by tag', async () => {
      const response = await request(app)
        .get('/api/models/search')
        .query({ tag: 'test' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].tags).toContain('test');
    });

    it('should return empty array for no matches', async () => {
      const response = await request(app)
        .get('/api/models/search')
        .query({ query: 'NonExistentModel' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('GET /api/models/top-rated', () => {
    beforeEach(async () => {
      // Создаем дополнительные модели и рейтинги
      const model2 = await createTestModel(testUserId, 'Top Model 1');
      const model3 = await createTestModel(testUserId, 'Top Model 2');
      
      // Добавляем разные рейтинги
      await request(app)
        .post(`/api/models/${model2.id}/rate`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ value: 5 });
        
      await request(app)
        .post(`/api/models/${model3.id}/rate`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ value: 3 });
    });

    it('should return top rated models', async () => {
      const response = await request(app)
        .get('/api/models/top-rated')
        .query({ limit: 5 });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Проверяем сортировку по рейтингу
      if (response.body.length > 1) {
        expect(response.body[0].rating).toBeGreaterThanOrEqual(response.body[1].rating);
      }
    });

    it('should respect limit parameter', async () => {
      const limit = 2;
      const response = await request(app)
        .get('/api/models/top-rated')
        .query({ limit });

      expect(response.status).toBe(200);
      expect(response.body.length).toBeLessThanOrEqual(limit);
    });
  });
}); 