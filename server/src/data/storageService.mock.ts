import { StorageService } from './storageService';

/**
 * Мок-реализация сервиса хранения для тестирования
 */
export class MockStorageService implements StorageService {
  // Имитируем хранилище в памяти
  private files: Map<string, Buffer> = new Map();

  async uploadFile(buffer: Buffer, filename: string, _contentType: string): Promise<string> {
    this.files.set(filename, buffer);
    return this.getFileUrl(filename);
  }

  async uploadFileFromPath(_filepath: string, filename: string, _contentType: string): Promise<string> {
    // В тестах не работаем с реальными файлами, просто имитируем
    this.files.set(filename, Buffer.from('mock file content'));
    return this.getFileUrl(filename);
  }

  getFileUrl(filename: string): string {
    return `/mock-uploads/${filename}`;
  }

  async deleteFile(filename: string): Promise<void> {
    this.files.delete(filename);
  }

  // Дополнительные методы для тестирования
  exists(filename: string): boolean {
    return this.files.has(filename);
  }

  getFileContent(filename: string): Buffer | undefined {
    return this.files.get(filename);
  }
} 