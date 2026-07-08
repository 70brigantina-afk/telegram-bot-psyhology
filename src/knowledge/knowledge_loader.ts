import fs from 'fs/promises';
import path from 'path';
import { config } from '../config/config';

async function readMarkdownFile(dir: string, fileSuffix: string): Promise<string> {
  const files = await fs.readdir(dir);
  const match = files.find((file) => file.endsWith(fileSuffix));

  if (!match) {
    throw new Error(`Файл ${fileSuffix} не найден в ${dir}`);
  }

  return fs.readFile(path.join(dir, match), 'utf-8');
}

export interface KnowledgeBundle {
  marinaPersonality: string;
  voiceOfMarina: string;
  faq: string;
  practices: string;
  conversationMemory: string;
  dialogueScenarios: string;
  realDialogueExamples: string;
}

export class KnowledgeLoader {
  async loadKnowledge(): Promise<KnowledgeBundle> {
    const [marinaPersonality, voiceOfMarina, faq, practices, conversationMemory] = await Promise.all([
      readMarkdownFile(config.knowledgeDir, 'marina_personality.md'),
      readMarkdownFile(config.knowledgeDir, 'voice_of_marina.md'),
      readMarkdownFile(config.knowledgeDir, 'faq.md'),
      readMarkdownFile(config.knowledgeDir, 'practices.md'),
      readMarkdownFile(config.knowledgeDir, 'conversation_memory.md'),
    ]);

    const [dialogueScenarios, realDialogueExamples] = await Promise.all([
      readMarkdownFile(config.scenariosDir, 'dialogue_scenarios.md'),
      readMarkdownFile(config.scenariosDir, 'real_dialogue_examples.md'),
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

export const knowledgeLoader = new KnowledgeLoader();
