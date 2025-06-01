import { db } from '../data/postgresDb';
import bcrypt from 'bcryptjs';

describe('Database Functions', () => {
  describe('User Functions', () => {
    it('должен создавать нового пользователя и находить его по email', async () => {
      const email = 'dbtest@example.com';
      const password = await bcrypt.hash('password', 10);
      const username = 'dbtester';
      
      // Создаем пользователя
      const user = await db.createUser(email, password, username);
      
      // Проверяем, что пользователь создан корректно
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email', email);
      expect(user).toHaveProperty('password', password);
      expect(user).toHaveProperty('username', username);
      
      // Находим пользователя по email
      const foundUser = await db.findUserByEmail(email);
      
      // Проверяем, что найденный пользователь соответствует созданному
      expect(foundUser).not.toBeNull();
      expect(foundUser?.id).toBe(user.id);
      expect(foundUser?.email).toBe(email);
      expect(foundUser?.username).toBe(username);
    });
    
    it('должен находить пользователя по ID', async () => {
      const email = 'findbyid@example.com';
      const password = await bcrypt.hash('password', 10);
      const username = 'findbytester';
      
      // Создаем пользователя
      const user = await db.createUser(email, password, username);
      
      // Находим пользователя по ID
      const foundUser = await db.findUserById(user.id);
      
      // Проверяем, что найденный пользователь соответствует созданному
      expect(foundUser).not.toBeNull();
      expect(foundUser?.id).toBe(user.id);
      expect(foundUser?.email).toBe(email);
      expect(foundUser?.username).toBe(username);
    });
    
    it('должен возвращать null при поиске несуществующего пользователя', async () => {
      const nonExistentUser = await db.findUserByEmail('nonexistent@example.com');
      expect(nonExistentUser).toBeNull();
      
      const nonExistentUserId = await db.findUserById(99999);
      expect(nonExistentUserId).toBeNull();
    });
  });
  
  describe('Model Functions', () => {
    let userId: number;
    
    beforeEach(async () => {
      // Создаем пользователя для тестирования моделей
      const user = await db.createUser(
        'modeltest@example.com',
        await bcrypt.hash('password', 10),
        'modeltester'
      );
      userId = user.id;
    });
    
    it('должен создавать новую модель и находить её по ID', async () => {
      // Создаем модель
      const modelData = {
        title: 'Тестовая модель для БД',
        description: 'Описание тестовой модели',
        fileName: 'test-db.glb',
        fileUrl: '/uploads/test-db.glb',
        thumbnailUrl: '/thumbnails/default.png',
        userId,
        tags: ['тест', 'база данных']
      };
      
      const model = await db.createModel(modelData);
      
      // Проверяем, что модель создана корректно
      expect(model).toHaveProperty('id');
      expect(model).toHaveProperty('title', modelData.title);
      expect(model).toHaveProperty('description', modelData.description);
      expect(model).toHaveProperty('fileName', modelData.fileName);
      expect(model).toHaveProperty('fileUrl', modelData.fileUrl);
      expect(model).toHaveProperty('thumbnailUrl', modelData.thumbnailUrl);
      expect(model).toHaveProperty('userId', userId);
      expect(model.tags).toEqual(expect.arrayContaining(modelData.tags));
      
      // Находим модель по ID
      const foundModel = await db.getModelById(model.id);
      
      // Проверяем, что найденная модель соответствует созданной
      expect(foundModel).not.toBeNull();
      expect(foundModel?.id).toBe(model.id);
      expect(foundModel?.title).toBe(modelData.title);
      expect(foundModel?.userId).toBe(userId);
    });
    
    it('должен обновлять существующую модель', async () => {
      // Создаем модель
      const model = await db.createModel({
        title: 'Модель для обновления',
        description: 'Исходное описание',
        fileName: 'update-test.glb',
        fileUrl: '/uploads/update-test.glb',
        thumbnailUrl: '/thumbnails/default.png',
        userId,
        tags: ['исходный', 'тег']
      });
      
      // Обновляем модель
      const updateData = {
        title: 'Обновленная модель',
        description: 'Новое описание',
        tags: ['обновленный', 'тег']
      };
      
      const updatedModel = await db.updateModel(model.id, updateData);
      
      // Проверяем обновленные поля
      expect(updatedModel).toHaveProperty('id', model.id);
      expect(updatedModel).toHaveProperty('title', updateData.title);
      expect(updatedModel).toHaveProperty('description', updateData.description);
      expect(updatedModel.tags).toEqual(expect.arrayContaining(updateData.tags));
      
      // Проверяем неизмененные поля
      expect(updatedModel).toHaveProperty('fileName', model.fileName);
      expect(updatedModel).toHaveProperty('fileUrl', model.fileUrl);
      expect(updatedModel).toHaveProperty('userId', userId);
    });
    
    it('должен удалять модель', async () => {
      // Создаем модель
      const model = await db.createModel({
        title: 'Модель для удаления',
        description: 'Будет удалена',
        fileName: 'delete-test.glb',
        fileUrl: '/uploads/delete-test.glb',
        thumbnailUrl: '/thumbnails/default.png',
        userId,
        tags: ['удаление']
      });
      
      // Проверяем, что модель существует
      let foundModel = await db.getModelById(model.id);
      expect(foundModel).not.toBeNull();
      
      // Удаляем модель
      await db.deleteModel(model.id);
      
      // Проверяем, что модель удалена
      foundModel = await db.getModelById(model.id);
      expect(foundModel).toBeNull();
    });
    
    it('должен получать список моделей с пагинацией', async () => {
      // Создаем несколько моделей
      for (let i = 0; i < 5; i++) {
        await db.createModel({
          title: `Тестовая модель ${i}`,
          description: `Описание ${i}`,
          fileName: `test-${i}.glb`,
          fileUrl: `/uploads/test-${i}.glb`,
          thumbnailUrl: '/thumbnails/default.png',
          userId,
          tags: ['тест']
        });
      }
      
      // Получаем первые 3 модели
      const modelsPage1 = await db.getModels(0, 3);
      expect(modelsPage1).toBeInstanceOf(Array);
      expect(modelsPage1.length).toBe(3);
      
      // Получаем следующие 3 модели
      const modelsPage2 = await db.getModels(3, 3);
      expect(modelsPage2).toBeInstanceOf(Array);
      expect(modelsPage2.length).toBeGreaterThanOrEqual(2); // Минимум 2 модели должно быть
      
      // Проверяем, что это разные модели
      const page1Ids = modelsPage1.map(model => model.id);
      const page2Ids = modelsPage2.map(model => model.id);
      
      // Все ID на разных страницах должны быть уникальными
      page2Ids.forEach(id => {
        expect(page1Ids.includes(id)).toBe(false);
      });
    });
  });
  
  describe('Rating Functions', () => {
    let userId: number;
    let modelId: number;
    
    beforeEach(async () => {
      // Создаем пользователя и модель для тестирования рейтингов
      const user = await db.createUser(
        'ratingtest@example.com',
        await bcrypt.hash('password', 10),
        'ratingtester'
      );
      
      const model = await db.createModel({
        title: 'Модель для рейтинга',
        description: 'Тестирование рейтинга',
        fileName: 'rating-test.glb',
        fileUrl: '/uploads/rating-test.glb',
        thumbnailUrl: '/thumbnails/default.png',
        userId: user.id,
        tags: ['рейтинг']
      });
      
      userId = user.id;
      modelId = model.id;
    });
    
    it('должен добавлять рейтинг для модели', async () => {
      const rating = await db.rateModel(userId, modelId, 4);
      
      expect(rating).toHaveProperty('userId', userId);
      expect(rating).toHaveProperty('modelId', modelId);
      expect(rating).toHaveProperty('value', 4);
    });
    
    it('должен обновлять существующий рейтинг', async () => {
      // Сначала добавляем рейтинг
      await db.rateModel(userId, modelId, 3);
      
      // Затем обновляем рейтинг
      const updatedRating = await db.rateModel(userId, modelId, 5);
      
      expect(updatedRating).toHaveProperty('userId', userId);
      expect(updatedRating).toHaveProperty('modelId', modelId);
      expect(updatedRating).toHaveProperty('value', 5);
    });
  });
}); 