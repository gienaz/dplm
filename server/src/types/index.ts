// Интерфейс 3D модели
export interface Model3D {
  id: number;
  title: string;           // Название модели
  description: string;     // Описание модели
  fileUrl: string;        // Путь к файлу модели
  thumbnailUrl?: string;  // Путь к превью (необязательно)
  fileType: ModelFileType; // Тип файла модели
  uploadedAt: Date;       // Дата загрузки
  userId: number;         // ID пользователя
  tags: string[];         // Теги модели
  likes: number;          // Количество лайков
  downloads: number;      // Количество скачиваний
}

// Перечисление поддерживаемых типов файлов
export enum ModelFileType {
  STL = 'stl',
  OBJ = 'obj',
  GLTF = 'gltf'
}

// Интерфейс ответа с данными модели
export interface ModelResponse extends Model3D {
  author: {
    id: number;          // ID автора
    name: string;        // Имя автора
  };
}

// Интерфейс для создания новой модели
export interface CreateModelDto {
  title: string;         // Название модели
  description: string;   // Описание модели
  tags: string[];        // Теги модели
}

// Интерфейс ответа с ошибкой
export interface ErrorResponse {
  message: string;       // Сообщение об ошибке
}

// Интерфейс пользователя
export interface User {
  id: number;           // ID пользователя
  name: string;         // Имя пользователя
  email: string;        // Email пользователя
  password: string;     // Хэшированный пароль
  role: string;         // Роль пользователя (user/admin)
  createdAt: Date;      // Дата создания
} 