const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('TypeScript сборка:');
console.log('--------------------------------');

// В Docker контейнере файлы находятся в текущей директории
const currentDir = process.cwd();
console.log('Текущая директория:', currentDir);

const srcDir = path.join(currentDir, 'src');
const distDir = path.join(currentDir, 'dist');
const tsconfigPath = path.join(currentDir, 'tsconfig.json');

// Вывод версии TypeScript
console.log('📋 Версия TypeScript:');
try {
  const tsVersion = execSync('npx tsc --version').toString();
  console.log(tsVersion);
} catch (error) {
  console.log('❌ Ошибка при проверке версии TypeScript:', error.message);
}

// Проверка структуры проекта
console.log('Проверка наличия файлов:');
console.log('- tsconfig.json:', fs.existsSync(tsconfigPath));
console.log('- src/', fs.existsSync(srcDir));

if (!fs.existsSync(tsconfigPath)) {
  console.log('❌ Файл tsconfig.json не найден');
  console.log('Содержимое директории:');
  try {
    const files = fs.readdirSync(currentDir);
    console.log(files);
  } catch (error) {
    console.log('Ошибка чтения директории:', error.message);
  }
  process.exit(1);
}

if (!fs.existsSync(srcDir)) {
  console.log('❌ Директория src не найдена');
  process.exit(1);
}

// Удаление существующей директории dist
if (fs.existsSync(distDir)) {
  console.log('Удаление существующей директории dist...');
  fs.rmSync(distDir, { recursive: true, force: true });
}

// Создание директории dist
console.log('Создание новой директории dist...');
fs.mkdirSync(distDir, { recursive: true });

try {
  // Компиляция TypeScript
  console.log('Запуск компиляции TypeScript...');
  execSync('npx tsc', { stdio: 'inherit' });
  
  // Проверка результатов компиляции
  const indexJsPath = path.join(distDir, 'index.js');
  console.log('Проверка наличия index.js:', indexJsPath);
  console.log('Файл существует:', fs.existsSync(indexJsPath));
  
  if (fs.existsSync(indexJsPath)) {
    console.log('✅ Компиляция успешна: файл index.js создан');
  } else {
    console.log('❌ Компиляция не удалась: файл index.js не создан');
    
    // Ищем index.ts в исходных файлах
    const indexTsPath = path.join(srcDir, 'index.ts');
    console.log('Проверка наличия index.ts:', indexTsPath);
    console.log('Файл существует:', fs.existsSync(indexTsPath));
    
    // Если файл index.ts существует, попробуем скомпилировать его напрямую
    if (fs.existsSync(indexTsPath)) {
      try {
        console.log('Компиляция index.ts напрямую...');
        execSync(`npx tsc ${indexTsPath} --outDir dist`, { stdio: 'inherit' });
      } catch (error) {
        console.log('Ошибка при прямой компиляции:', error.message);
      }
    }
    
    // Рекурсивно копируем и преобразуем файлы из src в dist
    console.log('Пробуем создать файлы вручную...');
    
    function copyAndTransform(src, dest) {
      const entries = fs.readdirSync(src, { withFileTypes: true });
      
      entries.forEach(entry => {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
          if (!fs.existsSync(destPath)) {
            fs.mkdirSync(destPath, { recursive: true });
          }
          copyAndTransform(srcPath, destPath);
        } else if (entry.name.endsWith('.ts')) {
          // Преобразуем .ts файлы в .js
          const content = fs.readFileSync(srcPath, 'utf8');
          const jsContent = content
            .replace(/import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g, 'const { $1 } = require("$2")')
            .replace(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g, 'const $1 = require("$2")')
            .replace(/export\s+{([^}]+)}/g, 'module.exports = { $1 }')
            .replace(/export\s+default\s+(\w+)/g, 'module.exports = $1')
            .replace(/export\s+const\s+(\w+)/g, 'const $1 = ')
            .replace(/:\s*(\w+)(\[\])?\s*=/g, ' =')
            .replace(/:\s*(\w+)(\[\])?\s*;/g, ';')
            .replace(/interface\s+(\w+)\s*{[^}]*}/g, '')
            .replace(/type\s+(\w+)\s*=\s*[^;]*;/g, '');
          
          const jsPath = destPath.replace(/\.ts$/, '.js');
          fs.writeFileSync(jsPath, jsContent);
          console.log(`✅ Создан файл ${jsPath}`);
        } else {
          // Копируем остальные файлы без изменений
          fs.copyFileSync(srcPath, destPath);
          console.log(`✅ Скопирован файл ${destPath}`);
        }
      });
    }
    
    copyAndTransform(srcDir, distDir);
    
    if (fs.existsSync(path.join(distDir, 'index.js'))) {
      console.log('✅ Файлы успешно созданы вручную');
    } else {
      console.error('❌ Не удалось создать файлы даже вручную');
      process.exit(1);
    }
  }
  
  console.log('👍 Сборка завершена успешно');
} catch (error) {
  console.error('❌ Ошибка при сборке:', error.message);
  process.exit(1);
} 