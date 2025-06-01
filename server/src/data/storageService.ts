import { Client } from 'minio';
import fs from 'fs';
import path from 'path';
import config from '../../config';

export interface StorageService {
  uploadFile(buffer: Buffer, filename: string, contentType: string): Promise<string>;
  uploadFileFromPath(filepath: string, filename: string, contentType: string): Promise<string>;
  getFileUrl(filename: string): string;
  deleteFile(filename: string): Promise<void>;
}

class MinioStorageService implements StorageService {
  private client: Client;
  private bucketName: string;
  private region: string;

  constructor() {
    this.bucketName = config.minio.bucket;
    this.region = 'us-east-1'; // Стандартный регион для MinIO

    this.client = new Client({
      endPoint: config.minio.endPoint,
      port: config.minio.port,
      useSSL: config.minio.useSSL,
      accessKey: config.minio.accessKey,
      secretKey: config.minio.secretKey
    });

    this.initBucket();
  }

  private async initBucket(): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.bucketName);
      if (!exists) {
        await this.client.makeBucket(this.bucketName, this.region);
        console.log(`Bucket '${this.bucketName}' created successfully`);
        
        // Устанавливаем политику доступа к бакету (публичный доступ на чтение)
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucketName}/*`]
            }
          ]
        };
        
        await this.client.setBucketPolicy(this.bucketName, JSON.stringify(policy));
      }
    } catch (error) {
      console.error('Error initializing MinIO bucket:', error);
    }
  }

  async uploadFile(buffer: Buffer, filename: string, contentType: string): Promise<string> {
    await this.client.putObject(this.bucketName, filename, buffer, {
      'Content-Type': contentType
    });
    
    return this.getFileUrl(filename);
  }

  async uploadFileFromPath(filepath: string, filename: string, contentType: string): Promise<string> {
    await this.client.fPutObject(this.bucketName, filename, filepath, {
      'Content-Type': contentType
    });
    
    return this.getFileUrl(filename);
  }

  getFileUrl(filename: string): string {
    // Если используем локальный MinIO, формируем URL вручную
    if (config.environment === 'production') {
      return `http://${config.minio.endPoint}:${config.minio.port}/${this.bucketName}/${filename}`;
    } else {
      // Для локальной разработки
      return `http://localhost:${config.minio.port}/${this.bucketName}/${filename}`;
    }
  }

  async deleteFile(filename: string): Promise<void> {
    await this.client.removeObject(this.bucketName, filename);
  }
}

// Класс для обратной совместимости с локальной файловой системой
class LocalStorageService implements StorageService {
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = path.join(__dirname, '../../', config.dirs.uploads);
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async uploadFile(buffer: Buffer, filename: string, _contentType: string): Promise<string> {
    const filepath = path.join(this.uploadsDir, filename);
    fs.writeFileSync(filepath, buffer);
    return this.getFileUrl(filename);
  }

  async uploadFileFromPath(filepath: string, filename: string, _contentType: string): Promise<string> {
    const destPath = path.join(this.uploadsDir, filename);
    fs.copyFileSync(filepath, destPath);
    return this.getFileUrl(filename);
  }

  getFileUrl(filename: string): string {
    return `/${config.dirs.uploads}/${filename}`;
  }

  async deleteFile(filename: string): Promise<void> {
    const filepath = path.join(this.uploadsDir, filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }
}

// Экспортируем нужный сервис в зависимости от настроек
export const storageService: StorageService = config.useMinIO 
  ? new MinioStorageService() 
  : new LocalStorageService(); 