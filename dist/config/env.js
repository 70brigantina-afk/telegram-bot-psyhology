"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectRoot = exports.envPath = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const projectRoot = path_1.default.resolve(__dirname, '../..');
exports.projectRoot = projectRoot;
const envPath = path_1.default.join(projectRoot, '.env');
exports.envPath = envPath;
const result = dotenv_1.default.config({
    path: envPath,
    override: true,
});
if (result.error && !fs_1.default.existsSync(envPath)) {
    console.warn(`[env] Файл .env не найден: ${envPath}`);
}
else if (result.error) {
    console.warn(`[env] Ошибка загрузки .env: ${result.error.message}`);
}
else {
    console.log(`[env] .env загружен из: ${envPath}`);
}
//# sourceMappingURL=env.js.map