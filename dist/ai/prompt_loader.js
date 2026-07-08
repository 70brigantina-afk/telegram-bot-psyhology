"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptLoader = exports.PromptLoader = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../config/config");
async function readMarkdownFile(dir, fileSuffix) {
    const files = await promises_1.default.readdir(dir);
    const match = files.find((file) => file.endsWith(fileSuffix));
    if (!match) {
        throw new Error(`Файл ${fileSuffix} не найден в ${dir}`);
    }
    return promises_1.default.readFile(path_1.default.join(dir, match), 'utf-8');
}
class PromptLoader {
    async loadPrompts() {
        const dir = config_1.config.promptsDir;
        const [master, system, behaviorRules, emotions, responseEngine, safety] = await Promise.all([
            readMarkdownFile(dir, 'master_prompt.md'),
            readMarkdownFile(dir, 'system_prompt.md'),
            readMarkdownFile(dir, 'bot_behavior_rules.md'),
            readMarkdownFile(dir, 'emotions_prompt.md'),
            readMarkdownFile(dir, 'response_engine.md'),
            readMarkdownFile(dir, 'safety_prompt.md'),
        ]);
        return {
            master,
            system,
            behaviorRules,
            emotions,
            responseEngine,
            safety,
        };
    }
}
exports.PromptLoader = PromptLoader;
exports.promptLoader = new PromptLoader();
//# sourceMappingURL=prompt_loader.js.map