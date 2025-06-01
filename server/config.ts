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

interface AppConfig {
  port: number;
  environment: string;
  database: DatabaseConfig;
  jwt: JwtConfig;
  dirs: DirsConfig;
}

const config: AppConfig = {
  // Общие настройки
  port: parseInt(process.env.PORT || '3000'),
  environment: process.env.NODE_ENV || 'development',
  
  // База данных
  database: {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '0000',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'models3d',
    
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
  }
};

export default config; 