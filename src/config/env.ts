import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve(__dirname, '../..');
const envPath = path.join(projectRoot, '.env');

const result = dotenv.config({
  path: envPath,
  override: true,
});

if (result.error && !fs.existsSync(envPath)) {
  console.warn(`[env] Файл .env не найден: ${envPath}`);
} else if (result.error) {
  console.warn(`[env] Ошибка загрузки .env: ${result.error.message}`);
} else {
  console.log(`[env] .env загружен из: ${envPath}`);
}

export { envPath, projectRoot };
