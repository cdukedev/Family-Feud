/**
 * Text normalization utilities for Family Feud answer matching.
 */

const ARTICLES = new Set(['a', 'an', 'the']);

const PLURAL_RULES: [RegExp, string][] = [
  [/ies$/i, 'y'],
  [/ves$/i, 'f'],
  [/oes$/i, 'o'],
  [/ses$/i, 's'],
  [/ches$/i, 'ch'],
  [/shes$/i, 'sh'],
  [/xes$/i, 'x'],
  [/zes$/i, 'z'],
  [/s$/i, ''],
];

/**
 * Normalize text for answer comparison:
 * - Strip punctuation
 * - Lowercase
 * - Remove articles (a, an, the)
 * - Basic plural-to-singular stemming
 */
export function normalize(text: string): string {
  // Lowercase and strip punctuation (keep alphanumeric and spaces)
  let normalized = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim();

  // Remove articles
  const words = normalized
    .split(/\s+/)
    .filter((w) => w.length > 0 && !ARTICLES.has(w));

  // Apply basic plural-to-singular stemming to each word
  const stemmed = words.map((word) => {
    if (word.length <= 2) return word;
    for (const [pattern, replacement] of PLURAL_RULES) {
      if (pattern.test(word)) {
        return word.replace(pattern, replacement);
      }
    }
    return word;
  });

  return stemmed.join(' ');
}

/**
 * Soundex phonetic encoding.
 * Returns a 4-character code representing the phonetic sound of the input.
 */
export function soundex(text: string): string {
  const normalized = text.toLowerCase().replace(/[^a-z]/g, '');
  if (normalized.length === 0) return '0000';

  const codes: Record<string, string> = {
    b: '1', f: '1', p: '1', v: '1',
    c: '2', g: '2', j: '2', k: '2', q: '2', s: '2', x: '2', z: '2',
    d: '3', t: '3',
    l: '4',
    m: '5', n: '5',
    r: '6',
  };

  let result = normalized[0].toUpperCase();
  let prevCode = codes[normalized[0]] || '';

  for (let i = 1; i < normalized.length && result.length < 4; i++) {
    const char = normalized[i];
    const code = codes[char] || '';

    // Skip vowels/h/w/y (no code) and consecutive duplicates
    if (code && code !== prevCode) {
      result += code;
    }
    prevCode = code || prevCode;
    // If the character is a vowel/h/w/y, it acts as a separator
    if (!code) {
      prevCode = '';
    }
  }

  return result.padEnd(4, '0');
}
