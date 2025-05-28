import { Request } from 'express';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface RegisterUserDto extends UserCredentials {
  name: string;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
  };
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
} 