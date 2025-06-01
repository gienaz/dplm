import { db } from '../data/postgresDb';
import dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';
import fs from 'fs';
import config from '../../config';
import createTestDatabase, { dbConfig } from './createTestDb';

// Загружаем переменные окружения из .env.test, если мы в режиме тестирования
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });
}

// Создаем директории для тестовых файлов
const createDirectories = () => {
  const uploadsDir = path.join(__dirname, '../../', config.dirs.uploads);
  const thumbnailsDir = path.join(__dirname, '../../', config.dirs.thumbnails);

  [uploadsDir, thumbnailsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Создана директория: ${dir}`);
    }
  });

  // Создаем дефолтную миниатюру, если её нет
  const defaultThumbnailPath = path.join(thumbnailsDir, 'default.png');
  if (!fs.existsSync(defaultThumbnailPath)) {
    // Создаем простое изображение 10x10 пикселей белого цвета
    const defaultThumbnailContent = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAADElEQVQI12NgGAUkAwABEAABJUCH5AAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(defaultThumbnailPath, defaultThumbnailContent);
    console.log('Создана дефолтная миниатюра');
  }
};

// Создаем тестовый пул соединений с базой данных для тестов
const setupTestDb = async () => {
  try {
    // Создаем тестовую базу данных, если её нет
    await createTestDatabase();
    
    // Создаем конфигурацию для тестовой базы данных
    const testDbConfig = {
      ...dbConfig,
      database: config.database.testName // Используем имя тестовой БД из конфига
    };
    
    console.log('Подключение к тестовой базе данных:', {
      ...testDbConfig,
      password: testDbConfig.password ? '******' : 'undefined'
    });
    
    // Заменяем пул соединений в db на тестовый
    const testPool = new Pool(testDbConfig);
    
    // Проверка соединения с базой данных
    const client = await testPool.connect();
    console.log('Соединение с тестовой базой данных установлено');
    client.release();
    
    // Заменяем пул в объекте db на тестовый
    (db as any).pool = testPool;
    
    return testPool;
  } catch (error) {
    console.error('Ошибка подключения к тестовой базе данных:', error);
    throw error;
  }
};

// Настройка перед всеми тестами
beforeAll(async () => {
  // Создаем необходимые директории
  createDirectories();
  
  // Настраиваем тестовую базу данных
  console.log('Инициализация тестовой базы данных...');
  try {
    await setupTestDb();
    
    // Инициализируем структуру базы данных
    await db.initDatabase();
    console.log('Тестовая база данных инициализирована успешно');
  } catch (error) {
    console.error('Ошибка инициализации тестовой БД:', error);
    throw error;
  }
}, 30000); // Увеличиваем таймаут для beforeAll

// Очистка после каждого теста
afterEach(async () => {
  try {
    // Очистка таблиц между тестами
    const client = await (db as any).pool.connect();
    await client.query('BEGIN');
    await client.query('DELETE FROM ratings');
    await client.query('DELETE FROM models');
    await client.query('DELETE FROM users');
    await client.query('COMMIT');
    client.release();
  } catch (error) {
    console.error('Ошибка очистки тестовой БД:', error);
  }
});

// Завершение после всех тестов
afterAll(async () => {
  try {
    // Закрываем соединение с базой данных
    console.log('Закрытие соединения с тестовой БД...');
    await (db as any).pool.end();
    console.log('Соединение с тестовой БД закрыто');
  } catch (error) {
    console.error('Ошибка закрытия соединения с БД:', error);
  }
}); 