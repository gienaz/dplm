import { Response } from 'express';
import { auth, generateToken, AuthRequest } from '../middleware/auth';
import { createTestUser } from './testUtils';

// Мок для Response
const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

// Мок для Request
const mockRequest = (headers: any = {}, body: any = {}) => {
  return {
    header: (name: string) => headers[name],
    body
  } as AuthRequest;
};

describe('Auth Middleware', () => {
  describe('auth middleware', () => {
    let user: any;
    let token: string;
    
    beforeEach(async () => {
      // Создаем пользователя для тестирования middleware с уникальным email
      user = await createTestUser();
      
      // Используем токен, созданный в createTestUser
      token = user.token;
    });
    
    it('должен добавлять пользователя в request при валидном токене', async () => {
      const req = mockRequest({
        'Authorization': `Bearer ${token}`
      }) as AuthRequest;
      const res = mockResponse();
      const next = jest.fn();
      
      await auth(req, res, next);
      
      // Проверяем, что next() был вызван (запрос продолжен)
      expect(next).toHaveBeenCalled();
      
      // Проверяем, что пользователь добавлен в request
      expect(req).toHaveProperty('user');
      expect(req.user).toHaveProperty('id', user.id);
      expect(req.user).toHaveProperty('email', user.email);
    });
    
    it('должен возвращать ошибку 401 при отсутствии токена', async () => {
      const req = mockRequest();
      const res = mockResponse();
      const next = jest.fn();
      
      await auth(req, res, next);
      
      // Проверяем, что next() не был вызван
      expect(next).not.toHaveBeenCalled();
      
      // Проверяем, что был возвращен статус 401
      expect(res.status).toHaveBeenCalledWith(401);
      
      // Проверяем сообщение об ошибке - обновлено в соответствии с текущей реализацией
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Токен не предоставлен'
      }));
    });
    
    it('должен возвращать ошибку 401 при невалидном токене', async () => {
      const req = mockRequest({
        'Authorization': 'Bearer invalid-token'
      });
      const res = mockResponse();
      const next = jest.fn();
      
      await auth(req, res, next);
      
      // Проверяем, что next() не был вызван
      expect(next).not.toHaveBeenCalled();
      
      // Проверяем, что был возвращен статус 401
      expect(res.status).toHaveBeenCalledWith(401);
      
      // Проверяем сообщение об ошибке - обновлено в соответствии с текущей реализацией
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Недействительный токен'
      }));
    });
  });
  
  describe('generateToken function', () => {
    it('должен генерировать валидный JWT токен', () => {
      const userId = 1;
      const email = 'test@example.com';
      
      const token = generateToken(userId, email);
      
      // Проверяем, что токен не пустой
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      
      // Обычно JWT токен состоит из трех частей, разделенных точками
      const parts = token.split('.');
      expect(parts.length).toBe(3);
    });
  });
}); 