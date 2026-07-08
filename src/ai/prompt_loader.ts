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

export interface PromptBundle {
  master: string;
  system: string;
  behaviorRules: string;
  emotions: string;
  responseEngine: string;
  safety: string;
}

export class PromptLoader {
  async loadPrompts(): Promise<PromptBundle> {
    const dir = config.promptsDir;

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

export const promptLoader = new PromptLoader();
