import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../data/postgresDb';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();

// Создаем необходимые директории
const uploadsDir = path.join(__dirname, '../../uploads');
const thumbnailsDir = path.join(__dirname, '../../thumbnails');

[uploadsDir, thumbnailsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Создаем дефолтную миниатюру, если её нет
const defaultThumbnailPath = path.join(thumbnailsDir, 'default.png');
if (!fs.existsSync(defaultThumbnailPath)) {
  // Создаем простое изображение 200x200 пикселей белого цвета
  const defaultThumbnailContent = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAABZ0RVh0Q3JlYXRpb24gVGltZQAxMC8yOS8yM7rRiVEAAAAcdEVYdFNvZnR3YXJlAEFkb2JlIEZpcmV3b3JrcyBDUzbovLKMAAABJElEQVR4nO3BMQEAAADCoPVPbQwfoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOA1v9QAATX68/0AAAAASUVORK5CYII=', 'base64');
  fs.writeFileSync(defaultThumbnailPath, defaultThumbnailContent);
}

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
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

    const models = await db.getModels(offset, limit);
    
    // Получаем общее количество моделей
    const result = await db['pool'].query('SELECT COUNT(*) FROM models');
    const total = parseInt(result.rows[0].count);

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
    let sql = 'SELECT id, title, description, file_name as "fileName", file_url as "fileUrl", thumbnail_url as "thumbnailUrl", user_id as "userId", tags FROM models WHERE 1=1';
    const params: any[] = [];
    
    if (query) {
      sql += ' AND (title ILIKE $1 OR description ILIKE $1)';
      params.push(`%${query}%`);
    }
    
    if (tag) {
      if (params.length) {
        sql += ` AND $${params.length + 1} = ANY(tags)`;
      } else {
        sql += ' AND $1 = ANY(tags)';
      }
      params.push(tag);
    }
    
    const result = await db['pool'].query(sql, params);
    return res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при поиске моделей:', error);
    return res.status(500).json({ error: 'Ошибка при поиске моделей' });
  }
});

// Получение топ-рейтинговых моделей
router.get('/top-rated', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const sql = `
      SELECT m.id, m.title, m.description, m.file_name as "fileName", 
             m.file_url as "fileUrl", m.thumbnail_url as "thumbnailUrl", 
             m.user_id as "userId", m.tags,
             COALESCE(AVG(r.value), 0) as rating
      FROM models m
      LEFT JOIN ratings r ON m.id = r.model_id
      GROUP BY m.id
      ORDER BY rating DESC
      LIMIT $1
    `;
    
    const result = await db['pool'].query(sql, [limit]);
    return res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении топ-рейтинговых моделей:', error);
    return res.status(500).json({ error: 'Ошибка при получении топ-рейтинговых моделей' });
  }
});

// Получение модели по ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const model = await db.getModelById(parseInt(req.params.id));
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

    const model = await db.createModel({
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
    const model = await db.getModelById(modelId);

    if (!model) {
      return res.status(404).json({ error: 'Модель не найдена' });
    }

    if (model.userId !== req.user.id) {
      return res.status(403).json({ error: 'Нет прав на редактирование этой модели' });
    }

    const updatedModel = await db.updateModel(modelId, {
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
    const model = await db.getModelById(modelId);

    if (!model) {
      return res.status(404).json({ error: 'Модель не найдена' });
    }

    if (model.userId !== req.user.id) {
      return res.status(403).json({ error: 'Нет прав на удаление этой модели' });
    }

    await db.deleteModel(modelId);
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

    const model = await db.getModelById(modelId);
    if (!model) {
      return res.status(404).json({ error: 'Модель не найдена' });
    }

    const rating = await db.rateModel(req.user.id, modelId, value);
    return res.json(rating);
  } catch (error) {
    console.error('Ошибка при оценке модели:', error);
    return res.status(500).json({ error: 'Ошибка при оценке модели' });
  }
});

export default router; 