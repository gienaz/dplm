import { mockDb } from '../src/data/mockDb';
import { generateToken } from '../src/middleware/auth';
import bcrypt from 'bcryptjs';

export async function createTestUser(email = 'test@example.com', password = 'password123', username = 'testuser') {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await mockDb.createUser(email, hashedPassword, username);
  const token = generateToken(user.id, user.email);
  return { user, token };
}

export async function createTestModel(userId: number, title = 'Test Model') {
  return await mockDb.createModel({
    title,
    description: 'Test Description',
    fileName: 'test.stl',
    fileUrl: '/uploads/test.stl',
    thumbnailUrl: '/thumbnails/test.png',
    userId,
    tags: ['test', 'model']
  });
}

export function clearDatabase() {
  mockDb['users'] = [];
  mockDb['models'] = [];
  mockDb['ratings'] = [];
} 