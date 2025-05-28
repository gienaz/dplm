import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, AuthRequest } from '../types/auth';
import { ErrorResponse } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      const errorResponse: ErrorResponse = { message: 'Требуется авторизация' };
      return res.status(401).json(errorResponse);
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    const errorResponse: ErrorResponse = { message: 'Неверный токен авторизации' };
    res.status(401).json(errorResponse);
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    const errorResponse: ErrorResponse = { message: 'Доступ запрещен. Требуются права администратора' };
    return res.status(403).json(errorResponse);
  }
  next();
}; 