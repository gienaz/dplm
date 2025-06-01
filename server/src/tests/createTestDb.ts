import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import config from '../../config';

// Загружаем переменные окружения
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

// Настройки подключения к базе данных
const dbConfig = {
  user: config.database.user,
  password: config.database.password,
  host: config.database.host,
  port: config.database.port,
  database: 'postgres', // Подключаемся к базе postgres для создания новой БД
};

console.log('Используемая конфигурация БД:', {
  ...dbConfig,
  password: dbConfig.password ? '******' : 'undefined',
});

const createTestDatabase = async () => {
  // Подключаемся к postgres для создания тестовой БД
  const pool = new Pool(dbConfig);

  try {
    // Проверяем соединение
    console.log('Проверка соединения с PostgreSQL...');
    const client = await pool.connect();
    console.log('Соединение установлено');
    
    // Проверяем, существует ли тестовая база данных
    const testDbName = config.database.testName;
    const result = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = '${testDbName}'`
    );

    // Если тестовая БД не существует, создаем её
    if (result.rowCount === 0) {
      console.log(`Создаем тестовую базу данных ${testDbName}...`);
      await client.query(`CREATE DATABASE ${testDbName}`);
      console.log('Тестовая база данных создана');
    } else {
      console.log('Тестовая база данных уже существует');
    }
    
    client.release();
  } catch (error) {
    console.error('Ошибка при создании тестовой базы данных:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Запускаем создание БД если этот файл запущен напрямую
if (require.main === module) {
  createTestDatabase()
    .then(() => {
      console.log('Завершено');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Ошибка:', error);
      process.exit(1);
    });
}

export default createTestDatabase;
export { dbConfig }; 