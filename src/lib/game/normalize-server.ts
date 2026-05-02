// Server-side normalization (same logic as text-normalize.ts but without 'use client')

const ARTICLES = ['a', 'an', 'the'];

const IRREGULAR_PLURALS: Record<string, string> = {
  children: 'child', people: 'person', mice: 'mouse', teeth: 'tooth',
  feet: 'foot', geese: 'goose', men: 'man', women: 'woman',
  knives: 'knife', wives: 'wife', lives: 'life', leaves: 'leaf',
};

function basicStem(word: string): string {
  if (IRREGULAR_PLURALS[word]) return IRREGULAR_PLURALS[word];
  if (word.endsWith('ies') && word.length > 4) return word.slice(0, -3) + 'y';
  if (word.endsWith('ves') && word.length > 4) return word.slice(0, -3) + 'f';
  if (word.endsWith('ses') || word.endsWith('xes') || word.endsWith('zes') ||
      word.endsWith('ches') || word.endsWith('shes')) {
    return word.slice(0, -2);
  }
  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) {
    return word.slice(0, -1);
  }
  return word;
}

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => !ARTICLES.includes(w))
    .map(basicStem)
    .join(' ')
    .trim();
}

export function soundex(str: string): string {
  const s = str.toUpperCase().replace(/[^A-Z]/g, '');
  if (!s) return '';
  const map: Record<string, string> = {
    B:'1',F:'1',P:'1',V:'1', C:'2',G:'2',J:'2',K:'2',Q:'2',S:'2',X:'2',Z:'2',
    D:'3',T:'3', L:'4', M:'5',N:'5', R:'6',
  };
  let result = s[0];
  let lastCode = map[s[0]] || '';
  for (let i = 1; i < s.length; i++) {
    const code = map[s[i]] || '';
    if (code && code !== lastCode) {
      result += code;
      if (result.length === 4) break;
    }
    lastCode = code || lastCode;
  }
  return (result + '0000').slice(0, 4);
}
