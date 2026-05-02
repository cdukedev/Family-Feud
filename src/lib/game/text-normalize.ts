const ARTICLES = ['a', 'an', 'the'];

const IRREGULAR_PLURALS: Record<string, string> = {
  children: 'child',
  people: 'person',
  mice: 'mouse',
  teeth: 'tooth',
  feet: 'foot',
  geese: 'goose',
  men: 'man',
  women: 'woman',
  knives: 'knife',
  wives: 'wife',
  lives: 'life',
  leaves: 'leaf',
};

function basicStem(word: string): string {
  // Check irregular plurals first
  if (IRREGULAR_PLURALS[word]) return IRREGULAR_PLURALS[word];

  // Basic English plural stemming
  if (word.endsWith('ies') && word.length > 4) return word.slice(0, -3) + 'y';
  if (word.endsWith('ves') && word.length > 4) return word.slice(0, -3) + 'f';
  if (word.endsWith('ses') || word.endsWith('xes') || word.endsWith('zes') ||
      word.endsWith('ches') || word.endsWith('shes')) {
    return word.endsWith('ches') || word.endsWith('shes')
      ? word.slice(0, -2)
      : word.slice(0, -2);
  }
  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) {
    return word.slice(0, -1);
  }

  return word;
}

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')   // strip punctuation
    .split(/\s+/)
    .filter((word) => !ARTICLES.includes(word))
    .map(basicStem)
    .join(' ')
    .trim();
}

// Soundex phonetic encoding
export function soundex(str: string): string {
  const s = str.toUpperCase().replace(/[^A-Z]/g, '');
  if (!s) return '';

  const map: Record<string, string> = {
    B: '1', F: '1', P: '1', V: '1',
    C: '2', G: '2', J: '2', K: '2', Q: '2', S: '2', X: '2', Z: '2',
    D: '3', T: '3',
    L: '4',
    M: '5', N: '5',
    R: '6',
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

// Metaphone-like phonetic encoding (simplified)
export function metaphone(str: string): string {
  let s = str.toUpperCase().replace(/[^A-Z]/g, '');
  if (!s) return '';

  // Drop initial silent letters
  if (/^(KN|GN|PN|AE|WR)/.test(s)) s = s.slice(1);

  let result = '';
  for (let i = 0; i < s.length && result.length < 6; i++) {
    const c = s[i];
    const prev = s[i - 1] || '';
    const next = s[i + 1] || '';

    // Skip duplicate adjacent letters
    if (c === prev) continue;

    switch (c) {
      case 'A': case 'E': case 'I': case 'O': case 'U':
        if (i === 0) result += c;
        break;
      case 'B':
        if (prev !== 'M') result += 'B';
        break;
      case 'C':
        if ('EIY'.includes(next)) result += 'S';
        else result += 'K';
        break;
      case 'D':
        if (next === 'G' && 'EIY'.includes(s[i + 2] || '')) result += 'J';
        else result += 'T';
        break;
      case 'F': result += 'F'; break;
      case 'G':
        if (next === 'H' && !'AEIOU'.includes(s[i + 2] || '')) { i++; break; }
        if (i > 0 && 'EIY'.includes(next)) result += 'J';
        else result += 'K';
        break;
      case 'H':
        if ('AEIOU'.includes(next) && !'AEIOU'.includes(prev)) result += 'H';
        break;
      case 'J': result += 'J'; break;
      case 'K':
        if (prev !== 'C') result += 'K';
        break;
      case 'L': result += 'L'; break;
      case 'M': result += 'M'; break;
      case 'N': result += 'N'; break;
      case 'P':
        if (next === 'H') { result += 'F'; i++; }
        else result += 'P';
        break;
      case 'Q': result += 'K'; break;
      case 'R': result += 'R'; break;
      case 'S':
        if (next === 'H') { result += 'X'; i++; }
        else result += 'S';
        break;
      case 'T':
        if (next === 'H') { result += '0'; i++; }
        else result += 'T';
        break;
      case 'V': result += 'F'; break;
      case 'W': case 'Y':
        if ('AEIOU'.includes(next)) result += c;
        break;
      case 'X': result += 'KS'; break;
      case 'Z': result += 'S'; break;
    }
  }

  return result;
}
