import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../data/postgresDb';
import { generateToken, auth, AuthRequest } from '../middleware/auth';
import { loginValidation, registerValidation } from '../middleware/validation';

const router = Router();

// Регистрация нового пользователя
router.post('/register', registerValidation, async (req: Request, res: Response) => {
  try {
    const { email, password, username } = req.body;

    // Проверяем, существует ли пользователь
    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создаем пользователя
    const user = await db.createUser(email, hashedPassword, username);

    // Генерируем токен
    const token = generateToken(user.id, user.email);

    return res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      token
    });
  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    return res.status(500).json({ error: 'Ошибка при регистрации пользователя' });
  }
});

// Вход в систему
router.post('/login', loginValidation, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Находим пользователя
    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }

    // Проверяем пароль
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }

    // Генерируем токен
    const token = generateToken(user.id, user.email);

    return res.status(200).json({
      message: 'Успешный вход',
      token
    });
  } catch (error) {
    console.error('Ошибка при входе:', error);
    return res.status(500).json({ error: 'Ошибка при входе в систему' });
  }
});

// Получение информации о текущем пользователе
router.get('/profile', auth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Пользователь не авторизован' });
    }
    
    const user = await db.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Удаляем пароль из ответа
    const { password, ...userWithoutPassword } = user;
    
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Ошибка при получении профиля:', error);
    return res.status(500).json({ error: 'Ошибка при получении информации о пользователе' });
  }
});

export default router; 