"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.knowledgeLoader = exports.KnowledgeLoader = void 0;
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
class KnowledgeLoader {
    async loadKnowledge() {
        const [marinaPersonality, voiceOfMarina, faq, practices, conversationMemory] = await Promise.all([
            readMarkdownFile(config_1.config.knowledgeDir, 'marina_personality.md'),
            readMarkdownFile(config_1.config.knowledgeDir, 'voice_of_marina.md'),
            readMarkdownFile(config_1.config.knowledgeDir, 'faq.md'),
            readMarkdownFile(config_1.config.knowledgeDir, 'practices.md'),
            readMarkdownFile(config_1.config.knowledgeDir, 'conversation_memory.md'),
        ]);
        const [dialogueScenarios, realDialogueExamples] = await Promise.all([
            readMarkdownFile(config_1.config.scenariosDir, 'dialogue_scenarios.md'),
            readMarkdownFile(config_1.config.scenariosDir, 'real_dialogue_examples.md'),
        ]);
        return {
            marinaPersonality,
            voiceOfMarina,
            faq,
            practices,
            conversationMemory,
            dialogueScenarios,
            realDialogueExamples,
        };
    }
}
exports.KnowledgeLoader = KnowledgeLoader;
exports.knowledgeLoader = new KnowledgeLoader();
//# sourceMappingURL=knowledge_loader.js.map