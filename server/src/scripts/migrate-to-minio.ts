import fs from 'fs';
import path from 'path';
import { Client } from 'minio';
import { Pool } from 'pg';
import config from '../../config';
import mime from 'mime-types';

// Настройка MinIO клиента
const minioClient = new Client({
  endPoint: config.minio.endPoint,
  port: config.minio.port,
  useSSL: config.minio.useSSL,
  accessKey: config.minio.accessKey,
  secretKey: config.minio.secretKey
});

// Настройка Postgres клиента
const pool = new Pool({
  user: config.database.user,
  password: config.database.password,
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
});

// Директория загрузок
const uploadsDir = path.join(__dirname, '../../', config.dirs.uploads);

async function migrateFilesToMinIO() {
  console.log('Начинаем миграцию файлов в MinIO...');
  
  try {
    // Проверяем существование бакета
    const bucketExists = await minioClient.bucketExists(config.minio.bucket);
    if (!bucketExists) {
      console.log(`Создаем бакет ${config.minio.bucket}...`);
      await minioClient.makeBucket(config.minio.bucket, 'us-east-1');
      
      // Настраиваем политику доступа
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Action: ['s3:GetObject'],
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Resource: [`arn:aws:s3:::${config.minio.bucket}/*`],
            Sid: 'PublicRead'
          }
        ]
      };
      
      await minioClient.setBucketPolicy(config.minio.bucket, JSON.stringify(policy));
      console.log('Политика доступа для бакета установлена.');
    }
    
    // Получаем список файлов из базы данных
    const result = await pool.query('SELECT id, file_name, file_url FROM models');
    const models = result.rows;
    
    console.log(`Найдено ${models.length} моделей для миграции.`);
    
    // Мигрируем каждый файл
    for (const model of models) {
      const fileName = model.file_name;
      const filePath = path.join(uploadsDir, fileName);
      
      // Проверяем существование файла
      if (fs.existsSync(filePath)) {
        console.log(`Миграция файла ${fileName}...`);
        
        // Определяем Content-Type
        const contentType = mime.lookup(fileName) || 'application/octet-stream';
        
        // Загружаем файл в MinIO
        await minioClient.fPutObject(config.minio.bucket, fileName, filePath, {
          'Content-Type': contentType
        });
        
        // Создаем новый URL
        const newFileUrl = `http://${config.environment === 'production' ? 
          config.minio.endPoint : 'localhost'}:${config.minio.port}/${config.minio.bucket}/${fileName}`;
        
        // Обновляем URL в базе данных
        await pool.query(
          'UPDATE models SET file_url = $1 WHERE id = $2',
          [newFileUrl, model.id]
        );
        
        console.log(`Файл ${fileName} успешно мигрирован.`);
      } else {
        console.warn(`Файл ${fileName} не найден, пропускаем.`);
      }
    }
    
    console.log('Миграция файлов завершена успешно.');
  } catch (error) {
    console.error('Ошибка при миграции файлов:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Запускаем миграцию, если скрипт запущен напрямую
if (require.main === module) {
  migrateFilesToMinIO()
    .then(() => {
      console.log('Миграция завершена успешно.');
      process.exit(0);
    })
    .catch(err => {
      console.error('Ошибка миграции:', err);
      process.exit(1);
    });
}

export default migrateFilesToMinIO; 