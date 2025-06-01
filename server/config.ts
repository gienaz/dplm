/**
 * Конфигурация приложения
 * 
 * Этот файл содержит основные настройки приложения, которые можно
 * переопределить через переменные окружения
 */

interface DatabaseConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  name: string;
  testName: string;
}

interface JwtConfig {
  secret: string;
  expiresIn: string;
}

interface DirsConfig {
  uploads: string;
  thumbnails: string;
}

interface MinioConfig {
  endPoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  bucket: string;
}

interface AppConfig {
  port: number;
  environment: string;
  database: DatabaseConfig;
  jwt: JwtConfig;
  dirs: DirsConfig;
  minio: MinioConfig;
  useMinIO: boolean;
}

const config: AppConfig = {
  // Общие настройки
  port: parseInt(process.env.PORT || '3000'),
  environment: process.env.NODE_ENV || 'development',
  
  // База данных
  database: {
    user: process.env.DB_USER || process.env.POSTGRES_USER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || '0000',
    host: process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || process.env.POSTGRES_PORT || '5432'),
    name: process.env.DB_NAME || process.env.POSTGRES_DB || 'models3d',
    
    // Для тестовой базы данных
    testName: 'models3d_test'
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-here',
    expiresIn: '24h'
  },
  
  // Папки для хранения файлов
  dirs: {
    uploads: process.env.UPLOAD_DIR || 'uploads',
    thumbnails: process.env.THUMBNAIL_DIR || 'thumbnails'
  },
  
  // MinIO конфигурация
  minio: {
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    bucket: process.env.MINIO_BUCKET_NAME || 'models3d'
  },
  
  // Флаг использования MinIO вместо локальной файловой системы
  useMinIO: process.env.USE_MINIO !== 'false'
};

export default config; 