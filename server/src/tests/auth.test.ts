import request from 'supertest';
import app from '../app';
import { createTestUser } from './testUtils';

// Мокаем сервис хранения для всех тестов
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

describe('Auth API', () => {
  let testUser: any;
  
  beforeEach(async () => {
    // Создаем тестового пользователя для каждого теста с уникальным email
    testUser = await createTestUser();
  });
  
  describe('POST /api/auth/register', () => {
    it('должен регистрировать нового пользователя', async () => {
      const newUser = {
        email: `new${Date.now()}@example.com`,
        password: 'newpassword123',
        username: 'newuser'
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(201);
      
      // Обновлено в соответствии с текущей реализацией API
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('message', 'Пользователь успешно зарегистрирован');
      expect(typeof response.body.token).toBe('string');
    });
    
    it('должен возвращать ошибку при регистрации с существующим email', async () => {
      const duplicateUser = {
        email: testUser.email, // Используем email существующего пользователя
        password: 'password123',
        username: 'duplicateuser'
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateUser)
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Пользователь с таким email уже существует');
    });
    
    it('должен возвращать ошибку при отсутствии необходимых полей', async () => {
      const invalidUser = {
        email: `invalid${Date.now()}@example.com`,
        // Отсутствует password
        username: 'invaliduser'
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);
      
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors.length).toBeGreaterThan(0);
    });
  });
  
  describe('POST /api/auth/login', () => {
    it('должен аутентифицировать пользователя с правильными учетными данными', async () => {
      const credentials = {
        email: testUser.email,
        password: 'password123' // Пароль, который мы использовали при создании тестового пользователя
      };
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);
      
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('message', 'Успешный вход');
      expect(typeof response.body.token).toBe('string');
    });
    
    it('должен возвращать ошибку при неправильном пароле', async () => {
      const credentials = {
        email: testUser.email,
        password: 'wrongpassword'
      };
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Неверные учетные данные');
    });
    
    it('должен возвращать ошибку при несуществующем email', async () => {
      const credentials = {
        email: `nonexistent${Date.now()}@example.com`,
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Неверные учетные данные');
    });
  });
  
  describe('GET /api/auth/profile', () => {
    it('должен возвращать информацию о текущем пользователе', async () => {
      // Сначала логинимся, чтобы получить токен
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'password123'
        });
      
      const token = loginResponse.body.token;
      
      // Затем используем токен для получения информации о текущем пользователе
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('id', testUser.id);
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).toHaveProperty('username');
      expect(response.body).not.toHaveProperty('password'); // Пароль не должен возвращаться
    });
    
    it('должен возвращать ошибку при отсутствии токена', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Токен не предоставлен');
    });
  });
}); 