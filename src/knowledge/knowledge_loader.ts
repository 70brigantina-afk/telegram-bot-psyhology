import fs from 'fs/promises';
import path from 'path';
import { config } from '../config/config';
import type { IdentityTopic } from '../types/response.types';

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

export type FaqTopic =
  | 'who_is_marina'
  | 'what_can_you_do'
  | 'how_to_book'
  | 'how_marina_helps'
  | 'what_is_consultation';

const FAQ_MATCHERS: Array<{ topic: FaqTopic; patterns: RegExp[] }> = [
  {
    topic: 'who_is_marina',
    patterns: [
      /кто\s+такая\s+марин/i,
      /кто\s+такая\s+дугин/i,
      /расскаж(и|ите).{0,40}о\s+марин/i,
      /расскаж(и|ите).{0,40}марин/i,
      /что\s+за\s+марин/i,
      /кто\s+такая\s+марин[аы]\s+дугин/i,
    ],
  },
  {
    topic: 'what_can_you_do',
    patterns: [
      /что\s+ты\s+умее/i,
      /чем\s+ты\s+мож(ешь|ете)\s+помо/i,
      /что\s+ты\s+мож(ешь|ете)/i,
      /как\s+ты\s+мож(ешь|ете)\s+помо/i,
      /что\s+умеет\s+бот/i,
      /какие\s+у\s+тебя\s+возможности/i,
    ],
  },
  {
    topic: 'how_to_book',
    patterns: [
      /как\s+записат/i,
      /записаться\s+к\s+марин/i,
      /записаться\s+на\s+консультац/i,
      /как\s+попасть\s+к\s+марин/i,
      /как\s+связаться\s+с\s+марин/i,
    ],
  },
  {
    topic: 'how_marina_helps',
    patterns: [
      /чем\s+помогает\s+марин/i,
      /с\s+чем\s+работает\s+марин/i,
      /в\s+чём\s+помогает\s+марин/i,
      /какие\s+темы\s+бер[её]т\s+марин/i,
    ],
  },
  {
    topic: 'what_is_consultation',
    patterns: [
      /что\s+такое\s+консультац/i,
      /как\s+проходит\s+консультац/i,
      /что\s+будет\s+на\s+консультац/i,
    ],
  },
];

const IDENTITY_MATCHERS: Array<{ topic: IdentityTopic; patterns: RegExp[] }> = [
  {
    topic: 'who_am_i',
    patterns: [/^кто\s+я\??$/i, /кто\s+я\s+такая/i, /кто\s+я\s+такой/i, /кто\s+я\s+есть/i],
  },
  {
    topic: 'what_gender',
    patterns: [
      /какого\s+я\s+пола/i,
      /какого\s+пола\s+я/i,
      /я\s+мальчик\s+или\s+девочка/i,
      /какой\s+у\s+меня\s+пол/i,
    ],
  },
];

const PANIC_MARKERS = [
  'паническая атака',
  'паничка',
  'приступ паники',
  'паникую',
  'гипервентил',
  'не могу дышать',
  'сердце колотится',
  'сердца колотится',
];

export const DEFAULT_FAQ_ANSWERS: Record<FaqTopic, string> = {
  who_is_marina:
    'Марина Дугина — практикующий психолог. Она помогает людям справляться с тревогой, внутренним напряжением, эмоциональной перегрузкой, потерей опоры и сложными жизненными периодами.\n\nЕё подход бережный и практичный: не давить, не оценивать, а помочь человеку понять, что с ним происходит, и постепенно вернуть контакт с собой.',
  what_can_you_do:
    'Я могу помочь вам немного разобраться в состоянии: назвать чувство, снизить тревогу, подобрать короткую практику или объяснить, что может происходить внутри.\n\nЯ не заменяю психолога и не ставлю диагнозы. Но могу быть первым спокойным шагом, когда внутри тяжело или непонятно, что происходит.',
  how_to_book:
    'Если захотите работать с Мариной лично, можно записаться на консультацию. Я могу рассказать, с какими запросами она обычно работает, и помочь понять, подходит ли формат сейчас.\n\nНапишите, что для вас сейчас важнее: узнать о подходе или понять, с чем вы хотите прийти.',
  how_marina_helps:
    'Марина помогает с тревогой, внутренним напряжением, потерей опоры, усталостью от переживаний и сложными периодами, когда становится трудно справляться в одиночку.\n\nОна работает бережно: помогает понять, что происходит внутри, и найти более устойчивую опору — без давления и без готовых «правильных» ответов.',
  what_is_consultation:
    'Консультация — это спокойный разговор, где можно разобрать то, что сейчас давит: чувства, ситуацию, повторяющиеся реакции.\n\nЭто не лекция и не оценка. Марина помогает прояснить происходящее и найти реалистичный следующий шаг, опираясь на ваш темп.',
};

export const IDENTITY_ANSWERS: Record<IdentityTopic, string> = {
  who_am_i:
    'Я не могу знать это за вас или определить вашу личность по одному сообщению.\n\nНо если за этим вопросом стоит растерянность или ощущение, что вы потеряли контакт с собой, мы можем аккуратно с этого начать.\n\nЧто именно сейчас звучит внутри: «я не понимаю себя», «я устала от себя» или «я не знаю, чего хочу»?',
  what_gender:
    'Я не могу определять ваш пол или идентичность за вас.\n\nЕсли этот вопрос для вас сейчас важный или тревожный, с ним можно обращаться очень бережно — без давления и без попытки быстро поставить точку.\n\nЧто именно в этом вопросе сейчас вызывает напряжение?',
};

export const PANIC_REPLY =
  'Сейчас главное — не разбираться в причинах, а немного вернуть ощущение опоры.\n\nПоставьте обе стопы на пол. Посмотрите вокруг и найдите пять предметов, которые вы видите.\n\nПотом сделайте медленный выдох. Не обязательно глубоко дышать — просто чуть длиннее выдох.\n\nВы сейчас в безопасном месте?';

function extractCanonicalFaqAnswer(faqText: string, topic: FaqTopic): string | null {
  const trimmed = faqText.trim();
  if (!trimmed) {
    return null;
  }

  const preferredHeadings: Partial<Record<FaqTopic, RegExp>> = {
    who_is_marina: /как\s+бот\s+должен\s+отвечать\s+на\s+вопрос\s+[«"]?кто\s+такая\s+марин/i,
    what_can_you_do: /как\s+бот\s+должен\s+отвечать\s+на\s+вопрос\s+[«"]?что\s+ты\s+умее/i,
  };

  const preferred = preferredHeadings[topic];
  if (!preferred) {
    return null;
  }

  const sections = trimmed.split(/\n(?=#\s+)/).map((part) => part.trim()).filter(Boolean);
  const section = sections.find((item) => preferred.test(item));
  if (!section) {
    return null;
  }

  const answerMatch = section.match(/Ответ:\s*([\s\S]+)/i);
  if (!answerMatch?.[1]) {
    return null;
  }

  const cleaned = answerMatch[1]
    .replace(/\n---[\s\S]*$/g, '')
    .trim()
    .replace(/^["«]+/, '')
    .replace(/["»]+$/, '')
    .trim();

  return cleaned || null;
}

export function detectFaqTopic(userMessage: string): FaqTopic | null {
  const normalized = userMessage.trim();
  if (!normalized) {
    return null;
  }

  for (const matcher of FAQ_MATCHERS) {
    if (matcher.patterns.some((pattern) => pattern.test(normalized))) {
      return matcher.topic;
    }
  }

  return null;
}

export function detectIdentityTopic(userMessage: string): IdentityTopic | null {
  const normalized = userMessage.trim();
  if (!normalized) {
    return null;
  }

  for (const matcher of IDENTITY_MATCHERS) {
    if (matcher.patterns.some((pattern) => pattern.test(normalized))) {
      return matcher.topic;
    }
  }

  return null;
}

export function detectPanic(userMessage: string): boolean {
  const normalized = userMessage.toLowerCase();
  if (PANIC_MARKERS.some((marker) => normalized.includes(marker))) {
    return true;
  }
  return /(?:^|[^\p{L}])паника(?:[^\p{L}]|$)/u.test(normalized);
}

export function buildFaqAnswer(topic: FaqTopic, knowledge?: KnowledgeBundle | null): string {
  try {
    if (knowledge?.faq) {
      const fromFaq = extractCanonicalFaqAnswer(knowledge.faq, topic);
      if (fromFaq) {
        return fromFaq;
      }
    }
  } catch (error) {
    console.error('[faq] Failed to extract FAQ from knowledge, using fallback:', {
      topic,
      error,
    });
  }

  return DEFAULT_FAQ_ANSWERS[topic];
}

export function buildIdentityAnswer(topic: IdentityTopic): string {
  return IDENTITY_ANSWERS[topic];
}

export class KnowledgeLoader {
  async loadKnowledge(): Promise<KnowledgeBundle> {
    const empty: KnowledgeBundle = {
      marinaPersonality: '',
      voiceOfMarina: '',
      faq: '',
      practices: '',
      conversationMemory: '',
      dialogueScenarios: '',
      realDialogueExamples: '',
    };

    try {
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
    } catch (error) {
      console.error('[knowledge] Failed to load knowledge files, using empty bundle:', error);
      return empty;
    }
  }
}

export const knowledgeLoader = new KnowledgeLoader();
