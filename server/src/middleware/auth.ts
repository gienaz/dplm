import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { mockDb } from '../data/mockDb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

interface JwtPayload {
  id: number;
  email: string;
}

export const auth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ error: 'Пользователь не авторизован' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    mockDb.findUserById(decoded.id)
      .then(user => {
        if (!user) {
          res.status(401).json({ error: 'Пользователь не авторизован' });
          return;
        }
        req.user = { id: user.id, email: user.email };
        next();
      })
      .catch(() => {
        res.status(401).json({ error: 'Пользователь не авторизован' });
      });
  } catch (error) {
    res.status(401).json({ error: 'Пользователь не авторизован' });
  }
};

export const generateToken = (userId: number, email: string): string => {
  return jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '24h' });
}; 