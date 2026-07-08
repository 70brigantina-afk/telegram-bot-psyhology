"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.practiceSelector = exports.PracticeSelector = void 0;
const EMOTION_PRACTICE_MAP = {
    тревога: ['Возвращение в настоящий момент', 'Дыхание с удлиненным выдохом'],
    страх: ['Разделение факта и страха'],
    злость: ['Безопасное освобождение напряжения'],
    обида: ['Назвать то, что было важно'],
    вина: ['Разделить поступок и личность'],
    стыд: ['Поддерживающий внутренний диалог'],
    растерянность: ['Один маленький шаг'],
    истощение: ['Проверка ресурса'],
    усталость: ['Проверка ресурса'],
    грусть: ['Возвращение к своим желаниям'],
    одиночество: ['Возвращение к своим желаниям'],
};
class PracticeSelector {
    select(emotion, memory) {
        const emotionKey = emotion.primary_emotion.toLowerCase();
        const candidates = EMOTION_PRACTICE_MAP[emotionKey] ?? [];
        if (candidates.length === 0) {
            return null;
        }
        const available = candidates.filter((practice) => !memory.suggestedPractices.includes(practice));
        if (available.length === 0) {
            return null;
        }
        if (emotion.intensity === 'low' && emotion.recommended_strategy !== 'practice') {
            return null;
        }
        return available[0];
    }
}
exports.PracticeSelector = PracticeSelector;
exports.practiceSelector = new PracticeSelector();
//# sourceMappingURL=practice_selector.js.map