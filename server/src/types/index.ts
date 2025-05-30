export interface User {
  id: number;
  email: string;
  password: string;
  username: string;
}

export interface Model3D {
  id: number;
  title: string;
  description: string;
  fileName: string;
  fileUrl: string;
  thumbnailUrl: string;
  userId: number;
  tags: string[];
}

export interface Rating {
  userId: number;
  modelId: number;
  value: number;
}

export interface AuthRequest extends Request {
  user: {
    id: number;
    email: string;
  };
}

export interface AuthToken {
  userId: number;
  token: string;
}

export interface DatabaseError {
  code: string;
  message: string;
} 