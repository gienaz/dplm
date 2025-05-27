import multer from 'multer';
import path from 'path';
import { ModelFileType } from '../types';

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// Настройка хранилища
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

// Фильтр файлов
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = Object.values(ModelFileType);
  const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
  
  if (allowedTypes.includes(fileExtension as ModelFileType)) {
    cb(null, true);
  } else {
    cb(new Error('Неверный тип файла. Разрешены только файлы STL, OBJ и glTF.'));
  }
};

// Экспорт настроенного multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // Максимальный размер файла 100MB
  }
}); 