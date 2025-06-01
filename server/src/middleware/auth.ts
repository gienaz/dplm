import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../data/postgresDb';
import config from '../../config';

const JWT_SECRET = process.env.JWT_SECRET || config.jwt.secret;

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

export const auth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Токен не предоставлен' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const user = await db.findUserById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    req.user = { id: user.id, email: user.email };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Недействительный токен' });
  }
};

export const generateToken = (userId: number, email: string): string => {
  return jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '24h' });
}; 