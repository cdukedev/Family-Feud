import { normalize, soundex, metaphone } from './text-normalize';
import type { Answer } from '@/types/game';

export interface MatchResult {
  matched: boolean;
  matchedAnswer: Answer | null;
  tier: 'exact' | 'phonetic' | 'semantic' | 'none';
  isDuplicate: boolean;
}

// Tier 1: Exact and normalized string match
function exactMatch(
  input: string,
  answers: Answer[],
  revealed: number[],
): { answer: Answer; isDuplicate: boolean } | null {
  const normalizedInput = normalize(input);

  for (const answer of answers) {
    const candidates = [answer.text, ...answer.aliases].map(normalize);
    if (candidates.includes(normalizedInput)) {
      if (revealed.includes(answer.rank)) {
        return { answer, isDuplicate: true };
      }
      return { answer, isDuplicate: false };
    }
  }
  return null;
}

// Tier 2: Phonetic matching (Soundex + Metaphone)
function phoneticMatch(
  input: string,
  answers: Answer[],
  revealed: number[],
): { answer: Answer; isDuplicate: boolean } | null {
  const inputSoundex = soundex(input);
  const inputMetaphone = metaphone(input);

  for (const answer of answers) {
    const candidates = [answer.text, ...answer.aliases];
    const match = candidates.some(
      (c) => soundex(c) === inputSoundex || metaphone(c) === inputMetaphone,
    );
    if (match) {
      if (revealed.includes(answer.rank)) {
        return { answer, isDuplicate: true };
      }
      return { answer, isDuplicate: false };
    }
  }
  return null;
}

// Tier 3: Gemini semantic judgment (called from Edge Function)
// This is a placeholder — the actual Gemini call happens server-side
export async function semanticMatch(
  questionText: string,
  answers: Answer[],
  playerAnswer: string,
  revealed: number[],
  geminiJudge: (question: string, answers: string[], playerAnswer: string) => Promise<string>,
): Promise<{ answer: Answer; isDuplicate: boolean } | null> {
  const unrevealed = answers.filter((a) => !revealed.includes(a.rank));
  const allAnswerTexts = answers.map((a) => a.text);

  const result = await geminiJudge(questionText, allAnswerTexts, playerAnswer);

  if (result === 'NO MATCH') return null;

  const matched = answers.find(
    (a) => normalize(a.text) === normalize(result),
  );

  if (!matched) return null;

  if (revealed.includes(matched.rank)) {
    return { answer: matched, isDuplicate: true };
  }

  return { answer: matched, isDuplicate: false };
}

// Full matching pipeline (Tiers 1 + 2 — Tier 3 is server-side only)
export function matchAnswer(
  input: string,
  answers: Answer[],
  revealed: number[],
): MatchResult {
  // Tier 1: Exact match
  const exact = exactMatch(input, answers, revealed);
  if (exact) {
    return {
      matched: !exact.isDuplicate,
      matchedAnswer: exact.answer,
      tier: 'exact',
      isDuplicate: exact.isDuplicate,
    };
  }

  // Tier 2: Phonetic match
  const phonetic = phoneticMatch(input, answers, revealed);
  if (phonetic) {
    return {
      matched: !phonetic.isDuplicate,
      matchedAnswer: phonetic.answer,
      tier: 'phonetic',
      isDuplicate: phonetic.isDuplicate,
    };
  }

  // No client-side match — Tier 3 (Gemini) happens server-side
  return {
    matched: false,
    matchedAnswer: null,
    tier: 'none',
    isDuplicate: false,
  };
}
