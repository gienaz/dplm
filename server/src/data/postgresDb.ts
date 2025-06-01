import { Pool } from 'pg';
import { User, Model3D, Rating } from '../types';
import config from '../../config';

export interface Database {
  createUser(email: string, password: string, username: string): Promise<User>;
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: number): Promise<User | null>;
  getModels(offset: number, limit: number): Promise<Model3D[]>;
  getModelById(id: number): Promise<Model3D | null>;
  createModel(model: Omit<Model3D, 'id'>): Promise<Model3D>;
  updateModel(id: number, model: Partial<Model3D>): Promise<Model3D>;
  deleteModel(id: number): Promise<void>;
  rateModel(userId: number, modelId: number, value: number): Promise<Rating>;
  initDatabase(): Promise<void>;
}

class PostgresDb implements Database {
  private pool: Pool;

  constructor() {
    const dbConfig = {
      user: config.database.user,
      password: config.database.password,
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
    };
    
    console.log('Connecting to PostgreSQL with config:', {
      ...dbConfig,
      password: dbConfig.password ? '******' : 'undefined'
    });

    this.pool = new Pool(dbConfig);

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }

  async initDatabase(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Create users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          username VARCHAR(255) NOT NULL
        )
      `);
      
      // Create models table
      await client.query(`
        CREATE TABLE IF NOT EXISTS models (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          file_name VARCHAR(255) NOT NULL,
          file_url VARCHAR(255) NOT NULL,
          thumbnail_url VARCHAR(255) NOT NULL,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          tags TEXT[]
        )
      `);
      
      // Create ratings table
      await client.query(`
        CREATE TABLE IF NOT EXISTS ratings (
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          model_id INTEGER REFERENCES models(id) ON DELETE CASCADE,
          value INTEGER NOT NULL,
          PRIMARY KEY (user_id, model_id)
        )
      `);
      
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async createUser(email: string, password: string, username: string): Promise<User> {
    const result = await this.pool.query(
      'INSERT INTO users (email, password, username) VALUES ($1, $2, $3) RETURNING id, email, password, username',
      [email, password, username]
    );
    return result.rows[0];
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT id, email, password, username FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  async findUserById(id: number): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT id, email, password, username FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async getModels(offset: number, limit: number): Promise<Model3D[]> {
    const result = await this.pool.query(
      'SELECT id, title, description, file_name as "fileName", file_url as "fileUrl", thumbnail_url as "thumbnailUrl", user_id as "userId", tags FROM models ORDER BY id LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  async getModelById(id: number): Promise<Model3D | null> {
    const result = await this.pool.query(
      'SELECT id, title, description, file_name as "fileName", file_url as "fileUrl", thumbnail_url as "thumbnailUrl", user_id as "userId", tags FROM models WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async createModel(model: Omit<Model3D, 'id'>): Promise<Model3D> {
    const result = await this.pool.query(
      'INSERT INTO models (title, description, file_name, file_url, thumbnail_url, user_id, tags) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, title, description, file_name as "fileName", file_url as "fileUrl", thumbnail_url as "thumbnailUrl", user_id as "userId", tags',
      [model.title, model.description, model.fileName, model.fileUrl, model.thumbnailUrl, model.userId, model.tags]
    );
    return result.rows[0];
  }

  async updateModel(id: number, model: Partial<Model3D>): Promise<Model3D> {
    const currentModel = await this.getModelById(id);
    if (!currentModel) {
      throw new Error('Model not found');
    }

    // Build the SET part of the query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (model.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(model.title);
    }
    if (model.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(model.description);
    }
    if (model.fileName !== undefined) {
      updates.push(`file_name = $${paramIndex++}`);
      values.push(model.fileName);
    }
    if (model.fileUrl !== undefined) {
      updates.push(`file_url = $${paramIndex++}`);
      values.push(model.fileUrl);
    }
    if (model.thumbnailUrl !== undefined) {
      updates.push(`thumbnail_url = $${paramIndex++}`);
      values.push(model.thumbnailUrl);
    }
    if (model.tags !== undefined) {
      updates.push(`tags = $${paramIndex++}`);
      values.push(model.tags);
    }

    // Add the ID as the last parameter
    values.push(id);

    const result = await this.pool.query(
      `UPDATE models SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, title, description, file_name as "fileName", file_url as "fileUrl", thumbnail_url as "thumbnailUrl", user_id as "userId", tags`,
      values
    );

    return result.rows[0];
  }

  async deleteModel(id: number): Promise<void> {
    await this.pool.query('DELETE FROM models WHERE id = $1', [id]);
  }

  async rateModel(userId: number, modelId: number, value: number): Promise<Rating> {
    // Use upsert (insert or update)
    const result = await this.pool.query(
      `INSERT INTO ratings (user_id, model_id, value) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (user_id, model_id) 
       DO UPDATE SET value = $3
       RETURNING user_id as "userId", model_id as "modelId", value`,
      [userId, modelId, value]
    );
    return result.rows[0];
  }
}

export const db = new PostgresDb(); 