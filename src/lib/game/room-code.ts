const CONSONANTS = 'BCDFGHJKLMNPQRSTVWXYZ';
const VOWELS = 'AEIOU';

export function generateRoomCode(): string {
  // Generate a 4-letter pronounceable code (consonant-vowel-consonant-vowel pattern)
  const chars = [
    CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)],
    VOWELS[Math.floor(Math.random() * VOWELS.length)],
    CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)],
    VOWELS[Math.floor(Math.random() * VOWELS.length)],
  ];
  return chars.join('');
}

const AVATAR_COLORS = [
  '#E63946', '#457B9D', '#2ECC71', '#F39C12',
  '#9B59B6', '#1ABC9C', '#E74C3C', '#3498DB',
  '#2ECC71', '#E67E22', '#00BCD4', '#FF6B6B',
];

export function getAvatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}
