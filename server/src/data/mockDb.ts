import { User, Model3D, Rating } from '../types';

export interface MockDatabase {
  users: User[];
  models: Model3D[];
  ratings: Rating[];
  createUser(email: string, password: string, username: string): Promise<User>;
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: number): Promise<User | null>;
  getModels(offset: number, limit: number): Promise<Model3D[]>;
  getModelById(id: number): Promise<Model3D | null>;
  createModel(model: Omit<Model3D, 'id'>): Promise<Model3D>;
  updateModel(id: number, model: Partial<Model3D>): Promise<Model3D>;
  deleteModel(id: number): Promise<void>;
  rateModel(userId: number, modelId: number, value: number): Promise<Rating>;
}

class MockDatabaseImpl implements MockDatabase {
  users: User[] = [];
  models: Model3D[] = [];
  ratings: Rating[] = [];

  async createUser(email: string, password: string, username: string): Promise<User> {
    const id = this.users.length + 1;
    const user: User = { id, email, password, username };
    this.users.push(user);
    return user;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.users.find(u => u.email === email) || null;
  }

  async findUserById(id: number): Promise<User | null> {
    return this.users.find(u => u.id === id) || null;
  }

  async getModels(offset: number, limit: number): Promise<Model3D[]> {
    return this.models.slice(offset, offset + limit);
  }

  async getModelById(id: number): Promise<Model3D | null> {
    return this.models.find(m => m.id === id) || null;
  }

  async createModel(model: Omit<Model3D, 'id'>): Promise<Model3D> {
    const id = this.models.length + 1;
    const newModel = { ...model, id } as Model3D;
    this.models.push(newModel);
    return newModel;
  }

  async updateModel(id: number, model: Partial<Model3D>): Promise<Model3D> {
    const index = this.models.findIndex(m => m.id === id);
    if (index === -1) {
      throw new Error('Model not found');
    }
    this.models[index] = { ...this.models[index], ...model };
    return this.models[index];
  }

  async deleteModel(id: number): Promise<void> {
    const index = this.models.findIndex(m => m.id === id);
    if (index !== -1) {
      this.models.splice(index, 1);
    }
  }

  async rateModel(userId: number, modelId: number, value: number): Promise<Rating> {
    const rating: Rating = { userId, modelId, value };
    this.ratings.push(rating);
    return rating;
  }
}

export const mockDb = new MockDatabaseImpl(); 