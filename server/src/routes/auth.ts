import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, ErrorResponse } from '../types';
import { UserCredentials, RegisterUserDto, AuthResponse, UserRole } from '../types/auth';

const router: Router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Имитация базы данных пользователей
let users: User[] = [
  {
    id: 1,
    name: 'Admin',
    email: 'admin@example.com',
    password: bcrypt.hashSync('admin123', 10),
    role: UserRole.ADMIN,
    createdAt: new Date()
  }
];

// Регистрация нового пользователя
router.post('/register', async (req: Request, res: Response) => {
  try {
    const userData: RegisterUserDto = req.body;

    // Проверка существования пользователя
    if (users.some(user => user.email === userData.email)) {
      const errorResponse: ErrorResponse = { message: 'Пользователь с таким email уже существует' };
      return res.status(400).json(errorResponse);
    }

    // Создание нового пользователя
    const newUser: User = {
      id: users.length + 1,
      name: userData.name,
      email: userData.email,
      password: await bcrypt.hash(userData.password, 10),
      role: UserRole.USER,
      createdAt: new Date()
    };

    users.push(newUser);

    // Создание JWT токена
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const response: AuthResponse = {
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role as UserRole
      }
    };

    res.status(201).json(response);
  } catch (error) {
    const errorResponse: ErrorResponse = { message: 'Ошибка при регистрации пользователя' };
    res.status(500).json(errorResponse);
  }
});

// Вход пользователя
router.post('/login', async (req: Request, res: Response) => {
  try {
    const credentials: UserCredentials = req.body;
    const user = users.find(u => u.email === credentials.email);

    if (!user || !(await bcrypt.compare(credentials.password, user.password))) {
      const errorResponse: ErrorResponse = { message: 'Неверный email или пароль' };
      return res.status(401).json(errorResponse);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const response: AuthResponse = {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as UserRole
      }
    };

    res.json(response);
  } catch (error) {
    const errorResponse: ErrorResponse = { message: 'Ошибка при входе в систему' };
    res.status(500).json(errorResponse);
  }
});

export default router; 