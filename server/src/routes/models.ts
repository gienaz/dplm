import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { mockDb } from '../data/mockDb';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['.stl', '.obj', '.fbx', '.gltf', '.glb'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Неподдерживаемый тип файла'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// Получение списка моделей с пагинацией
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const models = await mockDb.getModels(offset, limit);
    const total = mockDb['models'].length;

    return res.json({
      models,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Ошибка при получении списка моделей:', error);
    return res.status(500).json({ error: 'Ошибка при получении списка моделей' });
  }
});

// Поиск моделей
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { query, tag } = req.query;
    let results = mockDb['models'];

    if (query) {
      results = results.filter(model =>
        model.title.toLowerCase().includes((query as string).toLowerCase()) ||
        model.description.toLowerCase().includes((query as string).toLowerCase())
      );
    }

    if (tag) {
      results = results.filter(model =>
        model.tags.includes(tag as string)
      );
    }

    return res.json(results);
  } catch (error) {
    console.error('Ошибка при поиске моделей:', error);
    return res.status(500).json({ error: 'Ошибка при поиске моделей' });
  }
});

// Получение топ-рейтинговых моделей
router.get('/top-rated', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const models = [...mockDb['models']];

    const modelsWithRating = models.map(model => {
      const ratings = mockDb['ratings'].filter(r => r.modelId === model.id);
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length
        : 0;
      return { ...model, rating: avgRating };
    });

    // Сортируем по рейтингу и ограничиваем количество
    const topRated = modelsWithRating
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit);

    return res.json(topRated);
  } catch (error) {
    console.error('Ошибка при получении топ-рейтинговых моделей:', error);
    return res.status(500).json({ error: 'Ошибка при получении топ-рейтинговых моделей' });
  }
});

// Получение модели по ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const model = await mockDb.getModelById(parseInt(req.params.id));
    if (!model) {
      return res.status(404).json({ error: 'Модель не найдена' });
    }
    return res.json(model);
  } catch (error) {
    console.error('Ошибка при получении модели:', error);
    return res.status(500).json({ error: 'Ошибка при получении модели' });
  }
});

// Загрузка новой модели
router.post('/', auth, upload.single('model'), async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Пользователь не авторизован' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Файл модели не загружен' });
  }

  try {
    const { title, description, tags } = req.body;
    const parsedTags = tags ? JSON.parse(tags) : [];

    const model = await mockDb.createModel({
      title,
      description,
      fileName: req.file.filename,
      fileUrl: `/uploads/${req.file.filename}`,
      thumbnailUrl: '/thumbnails/default.png',
      userId: req.user.id,
      tags: parsedTags
    });

    return res.status(201).json(model);
  } catch (error) {
    console.error('Ошибка при создании модели:', error);
    return res.status(500).json({ error: 'Ошибка при создании модели' });
  }
});

// Обновление модели
router.put('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Пользователь не авторизован' });
    }

    const modelId = parseInt(req.params.id);
    const model = await mockDb.getModelById(modelId);

    if (!model) {
      return res.status(404).json({ error: 'Модель не найдена' });
    }

    if (model.userId !== req.user.id) {
      return res.status(403).json({ error: 'Нет прав на редактирование этой модели' });
    }

    const updatedModel = await mockDb.updateModel(modelId, {
      ...req.body,
      userId: model.userId // Сохраняем оригинального владельца
    });

    return res.json(updatedModel);
  } catch (error) {
    console.error('Ошибка при обновлении модели:', error);
    return res.status(500).json({ error: 'Ошибка при обновлении модели' });
  }
});

// Удаление модели
router.delete('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Пользователь не авторизован' });
    }

    const modelId = parseInt(req.params.id);
    const model = await mockDb.getModelById(modelId);

    if (!model) {
      return res.status(404).json({ error: 'Модель не найдена' });
    }

    if (model.userId !== req.user.id) {
      return res.status(403).json({ error: 'Нет прав на удаление этой модели' });
    }

    await mockDb.deleteModel(modelId);
    return res.json({ message: 'Модель успешно удалена' });
  } catch (error) {
    console.error('Ошибка при удалении модели:', error);
    return res.status(500).json({ error: 'Ошибка при удалении модели' });
  }
});

// Оценка модели
router.post('/:id/rate', auth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Пользователь не авторизован' });
    }

    const modelId = parseInt(req.params.id);
    const value = parseInt(req.body.value);

    if (isNaN(value) || value < 1 || value > 5) {
      return res.status(400).json({ error: 'Оценка должна быть числом от 1 до 5' });
    }

    const model = await mockDb.getModelById(modelId);
    if (!model) {
      return res.status(404).json({ error: 'Модель не найдена' });
    }

    const rating = await mockDb.rateModel(req.user.id, modelId, value);
    return res.json(rating);
  } catch (error) {
    console.error('Ошибка при оценке модели:', error);
    return res.status(500).json({ error: 'Ошибка при оценке модели' });
  }
});

export default router; 