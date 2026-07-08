import { aiClient } from './ai_client';
import type { PromptBundle } from './prompt_loader';
import type { KnowledgeBundle } from '../knowledge/knowledge_loader';
import { practiceSelector } from '../knowledge/practice_selector';
import type { EmotionAnalysis } from '../types/emotion.types';
import type { DialogueStage, MemoryContext, ResponseType } from '../types/memory.types';
import type { GeneratedResponse, ResponseEngineInput, ResponseStrategy } from '../types/response.types';

const FORBIDDEN_PHRASES = [
  'мне жаль слышать',
  'ты не один',
  'вы не один',
  'ты не одна',
  'вы не одна',
  'это нормально',
  'я здесь, чтобы поддержать',
  'я здесь чтобы поддержать',
  'жизнь подбрасывает испытания',
  'это пройдет',
  'это пройдёт',
  'постарайся расслабиться',
  'постарайтесь расслабиться',
  'постарайся успокоиться',
  'постарайтесь успокоиться',
  'вам срочно нужна консультация',
  'только марина поможет',
  'запишитесь прямо сейчас',
];

const OPENING_STYLES = [
  'Судя по тому, что вы пишете...',
  'Похоже, эта тема действительно забирает много сил.',
  'Здесь важно не торопиться с выводами.',
  'Давайте попробуем отделить главное от второстепенного.',
  'Сейчас может быть полезно немного сузить фокус.',
  'Похоже, это не просто мысль, а состояние, которое уже влияет на вас.',
];

export interface DialogueAwareGeneratedResponse extends GeneratedResponse {
  dialogueStage: DialogueStage;
  lastBotQuestion?: string;
  lastIntent: string;
  lastResponseType: ResponseType;
  openingStyle?: string;
  softMarinaSuggested?: boolean;
}

export class ResponseEngine {
  private prompts!: PromptBundle;
  private knowledge!: KnowledgeBundle;

  init(prompts: PromptBundle, knowledge: KnowledgeBundle): void {
    this.prompts = prompts;
    this.knowledge = knowledge;
  }

  async generate(input: ResponseEngineInput): Promise<DialogueAwareGeneratedResponse> {
    const stage = this.resolveDialogueStage(input);
    const openingStyle = this.pickOpeningStyle(input.memory);
    const softMarina = this.shouldSuggestMarina(input);

    // Не предлагаем AI-практику слишком рано: только на этапе practice / high intensity + deepen.
    const practice =
      stage === 'practice' && this.shouldUsePractice(input.emotion, stage)
        ? practiceSelector.select(input.emotion, input.memory)
        : null;

    const strategy = this.resolveStrategy(input.emotion, practice, softMarina, stage);

    const text = await aiClient.complete([
      {
        role: 'system',
        content: this.buildSystemPrompt(strategy, practice, stage, openingStyle, softMarina),
      },
      {
        role: 'user',
        content: this.buildUserPrompt(input, strategy, practice, stage),
      },
    ]);

    const cleaned = text.trim();
    const question = this.extractLastQuestion(cleaned);

    return {
      text: cleaned,
      strategy,
      practiceUsed: practice ?? undefined,
      dialogueStage: stage === 'practice' && practice ? 'after_practice' : stage,
      lastBotQuestion: question,
      lastIntent: this.resolveIntent(input, stage),
      lastResponseType: this.mapResponseType(strategy, practice),
      openingStyle,
      softMarinaSuggested: softMarina,
    };
  }

  private resolveDialogueStage(input: ResponseEngineInput): DialogueStage {
    const message = input.userMessage.trim().toLowerCase();
    const memory = input.memory;
    const prev = memory.dialogueStage;
    const lastType = memory.lastResponseType;
    const wordCount = message.split(/\s+/).filter(Boolean).length;
    const isShort = wordCount <= 5;
    const isContinuationCue =
      /^(из[- ]?за|изза|работа|муж|жена|деньги|дети|семья|здоровье|не знаю|незнаю|устала|устал|ничего не помогает|опять|снова)\b/i.test(
        message,
      ) ||
      (!/[?]/.test(message) && isShort && Boolean(memory.lastBotQuestion || memory.topic || memory.lastEmotion));

    if (lastType === 'practice' || prev === 'after_practice' || prev === 'practice') {
      return 'after_practice';
    }

    if (this.shouldSuggestMarina(input) && (memory.topicHits >= 3 || /не справляюсь|не получается|давно|постоянно|снова и снова/.test(message))) {
      return 'marina_soft';
    }

    if (!memory.lastEmotion && !memory.topic && !memory.lastBotQuestion) {
      return 'reflect';
    }

    if (prev === 'reflect' || (!prev && memory.lastEmotion)) {
      return isContinuationCue ? 'clarify_cause' : 'clarify_cause';
    }

    if (prev === 'clarify_cause') {
      return isContinuationCue || isShort ? 'deepen' : 'deepen';
    }

    if (prev === 'deepen') {
      if (
        input.emotion.intensity === 'high' ||
        /практик|помоги|успоко|стало\s+хуже|очень\s+сильно/.test(message)
      ) {
        return 'practice';
      }
      return 'deepen';
    }

    if (prev === 'after_practice') {
      return 'deepen';
    }

    if (isContinuationCue) {
      return memory.topic || memory.lastBotQuestion ? 'clarify_cause' : 'reflect';
    }

    return 'reflect';
  }

  private shouldSuggestMarina(input: ResponseEngineInput): boolean {
    const message = input.userMessage.toLowerCase();
    if (/записаться|хочу\s+к\s+марин|нужна\s+консультац|нужен\s+психолог/.test(message)) {
      return true;
    }
    if (/не\s+справляюсь|сам[аоу]?\s+не\s+могу|уже\s+долго|две?\s+недел|месяц/.test(message)) {
      return true;
    }
    return (input.memory.topicHits ?? 0) >= 3;
  }

  private pickOpeningStyle(memory: MemoryContext): string {
    const previous = memory.lastOpeningStyle;
    const options = OPENING_STYLES.filter((item) => item !== previous);
    const pool = options.length > 0 ? options : OPENING_STYLES;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private shouldUsePractice(emotion: EmotionAnalysis, stage: DialogueStage): boolean {
    const emotionKey = emotion.primary_emotion.toLowerCase();
    if (emotionKey.includes('паник')) {
      return false;
    }
    if (stage !== 'practice') {
      return false;
    }

    return (
      emotion.recommended_strategy === 'practice' ||
      emotion.intensity === 'high' ||
      ['тревога', 'страх', 'злость', 'истощение', 'усталость'].includes(emotionKey)
    );
  }

  private resolveStrategy(
    emotion: EmotionAnalysis,
    practice: string | null,
    softMarina: boolean,
    stage: DialogueStage,
  ): ResponseStrategy {
    if (softMarina && stage === 'marina_soft') {
      return 'marina_referral';
    }
    if (practice) {
      return 'practice';
    }

    if (stage === 'reflect') {
      return 'name_emotion';
    }
    if (stage === 'after_practice') {
      return 'support';
    }

    const strategy = emotion.recommended_strategy as ResponseStrategy;
    const allowed: ResponseStrategy[] = [
      'support',
      'name_emotion',
      'practice',
      'reframe',
      'marina_referral',
    ];

    return allowed.includes(strategy) ? strategy : 'support';
  }

  private mapResponseType(strategy: ResponseStrategy, practice: string | null): ResponseType {
    if (practice || strategy === 'practice') {
      return 'practice';
    }
    if (strategy === 'marina_referral') {
      return 'marina_referral';
    }
    return 'support';
  }

  private resolveIntent(input: ResponseEngineInput, stage: DialogueStage): string {
    return `${stage}:${input.emotion.primary_emotion}`;
  }

  private extractLastQuestion(text: string): string | undefined {
    const matches = text.match(/[^.!?\n]+\?/g);
    if (!matches || matches.length === 0) {
      return undefined;
    }
    return matches[matches.length - 1].trim();
  }

  private buildSystemPrompt(
    strategy: ResponseStrategy,
    practice: string | null,
    stage: DialogueStage,
    openingStyle: string,
    softMarina: boolean,
  ): string {
    return [
      this.prompts.master,
      this.prompts.system,
      this.prompts.behaviorRules,
      this.prompts.responseEngine,
      this.knowledge.marinaPersonality,
      this.knowledge.voiceOfMarina,
      this.knowledge.conversationMemory,
      this.knowledge.dialogueScenarios,
      this.knowledge.realDialogueExamples,
      practice ? `Подходящая практика из базы:\n${this.knowledge.practices}` : '',
      `Выбранная стратегия: ${strategy}`,
      `Этап диалога: ${stage}`,
      practice
        ? `Можно предложить одну короткую практику: ${practice}`
        : 'Практику не предлагай, если этап не practice или человек просто хочет поговорить.',
      'Стиль: тёплый, взрослый, спокойный голос Марины. Без клише ChatGPT.',
      'Пиши коротко: 3–6 предложений. Не больше одного главного вопроса.',
      'Учитывай историю. Не начинай диалог заново, если человек отвечает на предыдущий вопрос.',
      'Если пользователь отвечает коротко (работа / муж / не знаю / устала) — это продолжение темы, а не новый запрос.',
      'Не повторяй предыдущий вопрос бота дословно и по смыслу.',
      `Не начинай ответ с того же открытия, что в прошлый раз. Предпочтительное разнообразие: можно близко к «${openingStyle}».`,
      'Не начинай каждый ответ одинаково: избегай подряд «Похоже...», «Кажется...», «Давайте попробуем...» если это уже было.',
      'Не диагностируй. Не фантазируй. Не продавай через страх.',
      softMarina
        ? 'Можно мягко упомянуть, что с повторяющейся темой можно поработать с Мариной лично. Без давления и без «срочно».'
        : 'Не предлагай запись к Марине, если человек об этом не просит и тема ещё не затянулась.',
      `Не используй шаблоны: ${FORBIDDEN_PHRASES.join('; ')}.`,
      this.stageGuidance(stage),
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  private stageGuidance(stage: DialogueStage): string {
    switch (stage) {
      case 'reflect':
        return 'Этап reflect: мягко отрази состояние и задай один уточняющий вопрос о причине/фокусе.';
      case 'clarify_cause':
        return 'Этап clarify_cause: развивай тему из ответа человека. Не спрашивай снова «что тревожит сильнее всего?», если это уже спрашивали. Уточни аспект темы.';
      case 'deepen':
        return 'Этап deepen: проясни, что именно тяжелее всего внутри этой темы. Один фокус.';
      case 'practice':
        return 'Этап practice: коротко признай состояние и предложи одну маленькую практику. Без лекции.';
      case 'after_practice':
        return 'Этап after_practice: воспринимай сообщение как реакцию на практику. Спроси, что изменилось / что помогло / где остаётся напряжение. Не начинай диалог заново.';
      case 'marina_soft':
        return 'Этап marina_soft: мягко предложи возможность индивидуальной работы с Мариной, без давления.';
      default:
        return 'Отвечай бережно, коротко, по текущей теме.';
    }
  }

  private buildUserPrompt(
    input: ResponseEngineInput,
    strategy: ResponseStrategy,
    practice: string | null,
    stage: DialogueStage,
  ): string {
    const history = input.memory.recentMessages
      .slice(-8)
      .map((item) => `${item.role}: ${item.content}`)
      .join('\n');

    const shortCue = this.describeShortContinuation(input.userMessage);

    return [
      `Сообщение человека: ${input.userMessage}`,
      shortCue ? `Интерпретация короткого ответа: ${shortCue}` : '',
      `Эмоция: ${input.emotion.primary_emotion}`,
      `Интенсивность: ${input.emotion.intensity}`,
      `Потребность: ${input.emotion.possible_need}`,
      `Стратегия: ${strategy}`,
      `Этап: ${stage}`,
      practice ? `Практика: ${practice}` : '',
      history ? `История:\n${history}` : '',
      input.memory.topic ? `Текущая тема: ${input.memory.topic}` : '',
      input.memory.lastEmotion ? `Прошлая эмоция: ${input.memory.lastEmotion}` : '',
      input.memory.lastBotQuestion
        ? `Предыдущий вопрос бота (НЕ повторять): ${input.memory.lastBotQuestion}`
        : '',
      input.memory.lastPractice ? `Последняя практика: ${input.memory.lastPractice}` : '',
      input.memory.lastResponseType
        ? `Тип прошлого ответа: ${input.memory.lastResponseType}`
        : '',
      typeof input.memory.topicHits === 'number'
        ? `Повторов темы: ${input.memory.topicHits}`
        : '',
      'Ответь как продолжение живого разговора, а не как новый диалог.',
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  private describeShortContinuation(message: string): string | null {
    const normalized = message.trim().toLowerCase().replace(/[.!?…]+$/g, '');
    if (!normalized) {
      return null;
    }

    if (/^не\s*знаю$/.test(normalized) || normalized === 'незнаю') {
      return 'человек не знает ответа — помоги мягко выбрать направление, без давления';
    }
    if (/^устал[аои]?$/.test(normalized)) {
      return 'человек назвал усталость — отрази усталость и уточни, что сильнее всего забирает силы';
    }
    if (/^(из[- ]?за\s+)?работы?$/.test(normalized) || normalized === 'работа') {
      return 'человек указал тему «работа» — развивай эту тему, не спрашивай снова общую причину тревоги';
    }
    if (/^муж$|^жена$|^деньги$|^дети$|^семья$/.test(normalized)) {
      return `человек назвал тему «${normalized}» — развивай её как продолжение, а не новый запрос`;
    }
    if (/ничего не помогает|не помогает/.test(normalized)) {
      return 'человек сообщает, что предыдущее не помогло — признай это и мягко уточни, где напряжение сильнее';
    }
    if (/стало\s+(чуть\s+)?легче|помогло|легче/.test(normalized)) {
      return 'реакция на практику/поддержку — отметь отклик и уточни, что именно помогло';
    }
    if (/опять|снова/.test(normalized)) {
      return 'повтор состояния — учитывай, что тема уже была, не отвечай как в первый раз';
    }
    return null;
  }
}

export const responseEngine = new ResponseEngine();
