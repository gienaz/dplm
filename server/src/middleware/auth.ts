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

export const auth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Please authenticate.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const user = await mockDb.findUserById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'Please authenticate.' });
    }

    req.user = { id: user.id, email: user.email };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Please authenticate.' });
  }
};

export const generateToken = (userId: number, email: string): string => {
  return jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '24h' });
}; 