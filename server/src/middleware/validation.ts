import { Request, Response, NextFunction } from 'express';

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const registerValidation = (req: Request, res: Response, next: NextFunction) => {
  const errors = [];
  const { email, password, username } = req.body;
  
  if (!email || !password || !username) {
    errors.push({ msg: 'Все поля обязательны' });
  }

  if (email && !isValidEmail(email)) {
    errors.push({ msg: 'Введите корректный email' });
  }
  
  if (password && password.length < 6) {
    errors.push({ msg: 'Пароль должен быть не менее 6 символов' });
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  return next();
};

export const loginValidation = (req: Request, res: Response, next: NextFunction) => {
  const errors = [];
  const { email, password } = req.body;
  
  if (!email || !password) {
    errors.push({ msg: 'Email и пароль обязательны' });
  }

  if (email && !isValidEmail(email)) {
    errors.push({ msg: 'Введите корректный email' });
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  return next();
}; 