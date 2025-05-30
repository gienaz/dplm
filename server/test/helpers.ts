import { mockDb } from '../src/data/mockDb';
import { generateToken } from '../src/middleware/auth';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

export function cleanupUploads() {
  if (fs.existsSync(UPLOADS_DIR)) {
    fs.rmSync(UPLOADS_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

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