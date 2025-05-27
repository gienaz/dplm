import { Router, RequestHandler } from 'express';
import { Model3D, ModelResponse, ModelFileType, ErrorResponse, CreateModelDto } from '../types';
import { upload } from '../config/upload';
import path from 'path';

const router: Router = Router();

// Имитация базы данных
let models: Model3D[] = [
  {
    id: 1,
    title: 'Пример Модели',
    description: 'Пример 3D модели',
    fileUrl: '/uploads/sample.stl',
    thumbnailUrl: '/uploads/thumbnails/sample.png',
    fileType: ModelFileType.STL,
    uploadedAt: new Date(),
    userId: 1,
    tags: ['пример', 'демо'],
    likes: 0,
    downloads: 0
  }
];

// Получить все модели с пагинацией и фильтрацией
router.get('/', ((req, res) => {
  const { page = '1', limit = '20', tag, sort } = req.query;
  let filteredModels = [...models];

  // Применить фильтр по тегу
  if (tag) {
    filteredModels = filteredModels.filter(model => 
      model.tags.includes(tag as string)
    );
  }

  // Применить сортировку
  if (sort === 'likes') {
    filteredModels.sort((a, b) => b.likes - a.likes);
  } else if (sort === 'downloads') {
    filteredModels.sort((a, b) => b.downloads - a.downloads);
  } else if (sort === 'recent') {
    filteredModels.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  }

  // Применить пагинацию
  const startIndex = (parseInt(page as string) - 1) * parseInt(limit as string);
  const endIndex = startIndex + parseInt(limit as string);
  const paginatedModels = filteredModels.slice(startIndex, endIndex);

  res.json({
    total: filteredModels.length,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    data: paginatedModels
  });
}) as RequestHandler);

// Получить одну модель
router.get('/:id', ((req, res) => {
  const model = models.find(m => m.id === parseInt(req.params.id));
  if (!model) {
    const errorResponse: ErrorResponse = { message: 'Модель не найдена' };
    return res.status(404).json(errorResponse);
  }

  // Здесь можно добавить увеличение просмотров или аналитику

  const modelResponse: ModelResponse = {
    ...model,
    author: {
      id: 1, // В реальном приложении получать из базы данных
      name: 'Иван Петров'
    }
  };

  res.json(modelResponse);
}) as RequestHandler);

// Загрузить новую модель
router.post('/', upload.single('model'), ((req, res) => {
  const modelData: CreateModelDto = req.body;
  const modelFile = req.file;

  if (!modelFile) {
    const errorResponse: ErrorResponse = { message: 'Файл не загружен' };
    return res.status(400).json(errorResponse);
  }

  const fileExtension = path.extname(modelFile.originalname).toLowerCase().substring(1);
  
  const newModel: Model3D = {
    id: models.length + 1,
    title: modelData.title,
    description: modelData.description,
    fileUrl: `/uploads/${modelFile.filename}`,
    fileType: fileExtension as ModelFileType,
    uploadedAt: new Date(),
    userId: 1, // В реальном приложении получать из аутентифицированного пользователя
    tags: modelData.tags,
    likes: 0,
    downloads: 0
  };

  models.push(newModel);
  res.status(201).json(newModel);
}) as RequestHandler);

// Поставить лайк модели
router.post('/:id/like', ((req, res) => {
  const model = models.find(m => m.id === parseInt(req.params.id));
  if (!model) {
    const errorResponse: ErrorResponse = { message: 'Модель не найдена' };
    return res.status(404).json(errorResponse);
  }

  model.likes += 1;
  res.json({ likes: model.likes });
}) as RequestHandler);

// Скачать модель
router.get('/:id/download', ((req, res) => {
  const model = models.find(m => m.id === parseInt(req.params.id));
  if (!model) {
    const errorResponse: ErrorResponse = { message: 'Модель не найдена' };
    return res.status(404).json(errorResponse);
  }

  model.downloads += 1;
  
  // В реальном приложении здесь будет потоковая передача файла из хранилища
  res.download(path.join(__dirname, '..', '..', model.fileUrl));
}) as RequestHandler);

export default router; 