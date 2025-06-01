import request from 'supertest';
import app from '../app';
import { db } from '../data/postgresDb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../../config';

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('должен зарегистрировать нового пользователя', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        username: 'newuser'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Проверяем успешный ответ
      expect(response.body).toHaveProperty('token');
      expect(response.body.message).toBe('Пользователь успешно зарегистрирован');

      // Проверяем, что пользователь создан в БД
      const user = await db.findUserByEmail(userData.email);
      expect(user).not.toBeNull();
      expect(user?.email).toBe(userData.email);
      expect(user?.username).toBe(userData.username);

      // Проверяем, что пароль хеширован
      const passwordMatch = await bcrypt.compare(userData.password, user!.password);
      expect(passwordMatch).toBe(true);
    });

    it('должен вернуть ошибку при регистрации с существующим email', async () => {
      // Создаем пользователя
      const userData = {
        email: 'existing@example.com',
        password: await bcrypt.hash('password123', 10),
        username: 'existing'
      };
      await db.createUser(userData.email, userData.password, userData.username);

      // Пытаемся зарегистрироваться с тем же email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: userData.email,
          password: 'newpassword',
          username: 'newusername'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Пользователь с таким email уже существует');
    });

    it('должен вернуть ошибку валидации при неверных данных', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: '123', // Слишком короткий пароль
          username: ''
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/auth/login', () => {
    it('должен успешно авторизовать пользователя с верными учетными данными', async () => {
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Создаем пользователя
      await db.createUser('login@example.com', hashedPassword, 'loginuser');

      // Логинимся
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: password
        })
        .expect(200);

      // Проверяем успешный ответ и наличие токена
      expect(response.body).toHaveProperty('token');
      expect(response.body.message).toBe('Успешный вход');

      // Проверяем валидность токена
      const token = response.body.token;
      const decoded = jwt.verify(token, config.jwt.secret) as { id: number, email: string };
      
      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('email', 'login@example.com');
    });

    it('должен вернуть ошибку при неверном пароле', async () => {
      const password = 'correctpassword';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Создаем пользователя
      await db.createUser('password@example.com', hashedPassword, 'passworduser');

      // Пытаемся войти с неверным паролем
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'password@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Неверные учетные данные');
    });

    it('должен вернуть ошибку при попытке входа с несуществующим email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'anypassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Неверные учетные данные');
    });
  });
}); 