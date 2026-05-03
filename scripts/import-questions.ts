/**
 * Family Feud Question Importer
 *
 * Scrapes real TV show questions from familyfeudinfo.com and imports them
 * into our Supabase database with proper answer distributions and aliases.
 *
 * Usage: npx tsx scripts/import-questions.ts
 */

import { createClient } from '@supabase/supabase-js';

// Load .env.local manually for script usage
import { readFileSync } from 'fs';
import { resolve } from 'path';
try {
  const envPath = resolve(process.cwd(), '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^#=]+)=["']?(.+?)["']?$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
} catch {}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Rate limiting
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

interface ScrapedAnswer {
  rank: number;
  text: string;
  points: number;
}

interface ScrapedQuestion {
  id: number;
  text: string;
  answers: ScrapedAnswer[];
}

// Common aliases for frequent answer words
const COMMON_ALIASES: Record<string, string[]> = {
  'car': ['automobile', 'vehicle', 'auto'],
  'tv': ['television', 'telly'],
  'phone': ['cell phone', 'cellphone', 'mobile', 'smartphone', 'mobile phone'],
  'money': ['cash', 'dollars', 'bucks'],
  'kids': ['children', 'child', 'kid'],
  'mom': ['mother', 'mama', 'mommy', 'ma'],
  'dad': ['father', 'papa', 'daddy', 'pa'],
  'dog': ['puppy', 'pup', 'doggy', 'canine'],
  'cat': ['kitty', 'kitten', 'feline'],
  'house': ['home', 'residence'],
  'doctor': ['dr', 'physician', 'doc'],
  'police': ['cops', 'police officer', 'cop', 'law enforcement'],
  'food': ['meal', 'grub', 'eat'],
  'beer': ['brew', 'brewski'],
  'wife': ['spouse', 'partner', 'wifey'],
  'husband': ['spouse', 'partner', 'hubby'],
  'church': ['chapel', 'temple', 'place of worship'],
  'school': ['class', 'classroom'],
  'store': ['shop', 'market'],
  'work': ['job', 'office', 'workplace'],
  'sleep': ['nap', 'rest', 'snooze'],
  'swimming pool': ['pool'],
  'french fries': ['fries', 'chips'],
  'hot dog': ['hotdog', 'frank', 'frankfurter', 'wiener'],
  'hamburger': ['burger', 'cheeseburger'],
  'ice cream': ['icecream'],
  'sunscreen': ['sunblock', 'sun screen', 'spf'],
  'toothbrush': ['tooth brush'],
  'underwear': ['undies', 'underpants', 'boxers', 'briefs'],
  'christmas': ['xmas'],
  'basketball': ['b-ball', 'bball'],
  'football': ['nfl'],
  'baseball': ['mlb'],
};

function generateAliases(answerText: string): string[] {
  const lower = answerText.toLowerCase().trim();
  const aliases: string[] = [];

  // Check direct matches
  if (COMMON_ALIASES[lower]) {
    aliases.push(...COMMON_ALIASES[lower]);
  }

  // Check if answer contains a known word
  for (const [word, wordAliases] of Object.entries(COMMON_ALIASES)) {
    if (lower.includes(word) && lower !== word) {
      // Add the word's aliases as partial matches
      for (const alias of wordAliases) {
        aliases.push(lower.replace(word, alias));
      }
    }
  }

  // Add without common prefixes
  for (const prefix of ['a ', 'an ', 'the ', 'your ', 'my ']) {
    if (lower.startsWith(prefix)) {
      aliases.push(lower.slice(prefix.length));
    }
  }

  // Add plural/singular variants
  if (lower.endsWith('s') && lower.length > 3) {
    aliases.push(lower.slice(0, -1));
  } else if (!lower.endsWith('s')) {
    aliases.push(lower + 's');
  }

  return [...new Set(aliases.filter(a => a !== lower && a.length > 1))];
}

async function fetchQuestionPage(id: number): Promise<ScrapedQuestion | null> {
  try {
    const url = `https://www.familyfeudinfo.com/question.php?id=${id}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const html = await res.text();

    // Extract question text
    const questionMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i)
      || html.match(/<div[^>]*class="question"[^>]*>(.*?)<\/div>/i)
      || html.match(/<title>(.*?)(?:\s*[-|])/i);

    if (!questionMatch) return null;

    let questionText = questionMatch[1]
      .replace(/<[^>]*>/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&#039;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();

    // Extract answers — look for table rows or list items with numbers
    const answers: ScrapedAnswer[] = [];

    // Pattern 1: Table rows with rank, answer, points
    const tablePattern = /<tr[^>]*>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(\d+)<\/td>/gi;
    let match;
    while ((match = tablePattern.exec(html)) !== null) {
      answers.push({
        rank: parseInt(match[1]),
        text: match[2].replace(/<[^>]*>/g, '').trim(),
        points: parseInt(match[3]),
      });
    }

    // Pattern 2: div-based answers
    if (answers.length === 0) {
      const divPattern = /class="answer"[^>]*>([^<]+)<\/.*?class="points"[^>]*>(\d+)/gi;
      let rank = 1;
      while ((match = divPattern.exec(html)) !== null) {
        answers.push({
          rank: rank++,
          text: match[1].trim(),
          points: parseInt(match[2]),
        });
      }
    }

    // Pattern 3: Generic number-answer-number pattern
    if (answers.length === 0) {
      const genericPattern = /(?:^|\n)\s*(\d+)\.\s*(.*?)\s+(\d+)\s*(?:$|\n)/gm;
      while ((match = genericPattern.exec(html)) !== null) {
        answers.push({
          rank: parseInt(match[1]),
          text: match[2].replace(/<[^>]*>/g, '').trim(),
          points: parseInt(match[3]),
        });
      }
    }

    if (answers.length === 0) return null;

    // Filter out invalid answers
    const validAnswers = answers.filter(a =>
      a.points > 0 && a.text.length > 0 && a.text.length < 100
    );

    if (validAnswers.length < 3) return null;

    return { id, text: questionText, answers: validAnswers };
  } catch (err) {
    console.error(`Failed to fetch question ${id}:`, err);
    return null;
  }
}

async function fetchQuestionAPI(id: number): Promise<ScrapedQuestion | null> {
  try {
    // Use the API to get the question details
    const url = `https://www.familyfeudinfo.com/api.php?id=${id}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data || !data.question) return null;

    const answers: ScrapedAnswer[] = [];
    if (Array.isArray(data.answers)) {
      for (let i = 0; i < data.answers.length; i++) {
        const a = data.answers[i];
        if (a.answer && a.points) {
          answers.push({
            rank: i + 1,
            text: a.answer.trim(),
            points: parseInt(a.points),
          });
        }
      }
    }

    if (answers.length < 3) return null;

    return {
      id,
      text: data.question.trim(),
      answers,
    };
  } catch {
    return null;
  }
}

async function importQuestions(startId: number, count: number) {
  console.log(`\n=== Importing questions from familyfeudinfo.com ===`);
  console.log(`Starting from ID ${startId}, attempting ${count} questions\n`);

  let imported = 0;
  let skipped = 0;
  let failed = 0;
  let currentId = startId;

  // Get existing questions to avoid duplicates
  const { data: existing } = await supabase
    .from('questions')
    .select('text')
    .eq('source', 'archive');

  const existingTexts = new Set(
    (existing || []).map(q => q.text.toLowerCase().trim())
  );

  while (imported < count && currentId > startId - 5000) {
    // Try API first, fall back to page scraping
    let question = await fetchQuestionAPI(currentId);
    if (!question) {
      question = await fetchQuestionPage(currentId);
    }

    currentId--;

    if (!question) {
      failed++;
      continue;
    }

    // Check for duplicate
    if (existingTexts.has(question.text.toLowerCase().trim())) {
      skipped++;
      continue;
    }

    // Determine category from question text
    const text = question.text.toLowerCase();
    let category = 'general';
    if (text.includes('christmas') || text.includes('holiday') || text.includes('halloween') || text.includes('thanksgiving')) category = 'holidays';
    else if (text.includes('food') || text.includes('eat') || text.includes('cook') || text.includes('restaurant') || text.includes('pizza') || text.includes('breakfast')) category = 'food';
    else if (text.includes('work') || text.includes('job') || text.includes('boss') || text.includes('office')) category = 'work';
    else if (text.includes('school') || text.includes('teacher') || text.includes('student') || text.includes('college')) category = 'school';
    else if (text.includes('married') || text.includes('husband') || text.includes('wife') || text.includes('wedding') || text.includes('dating')) category = 'relationships';
    else if (text.includes('car') || text.includes('drive') || text.includes('road')) category = 'cars';
    else if (text.includes('doctor') || text.includes('hospital') || text.includes('sick') || text.includes('health')) category = 'health';
    else if (text.includes('sport') || text.includes('game') || text.includes('play') || text.includes('team')) category = 'sports';
    else if (text.includes('money') || text.includes('buy') || text.includes('expensive') || text.includes('cheap')) category = 'money';
    else if (text.includes('animal') || text.includes('dog') || text.includes('cat') || text.includes('pet')) category = 'animals';
    else if (text.includes('house') || text.includes('home') || text.includes('room') || text.includes('kitchen')) category = 'household';
    else if (text.includes('kid') || text.includes('child') || text.includes('baby') || text.includes('parent') || text.includes('family')) category = 'family';

    // Determine if suitable for fast money (shorter questions, more universal)
    const fastMoneyOk = question.answers.length >= 4 && question.text.length < 80;

    // Insert question
    const { data: insertedQ, error: qErr } = await supabase
      .from('questions')
      .insert({
        text: question.text,
        answer_count: question.answers.length,
        category,
        difficulty: 'medium',
        source: 'archive',
        source_detail: `familyfeudinfo.com/question.php?id=${question.id}`,
        fast_money_ok: fastMoneyOk,
        times_used: 0,
        tags: [category],
      })
      .select()
      .single();

    if (qErr || !insertedQ) {
      console.error(`  ✗ Failed to insert question: ${question.text.substring(0, 50)}...`, qErr?.message);
      failed++;
      continue;
    }

    // Insert answers with aliases
    const answerRows = question.answers.map(a => ({
      question_id: insertedQ.id,
      rank: a.rank,
      text: a.text,
      points: a.points,
      aliases: generateAliases(a.text),
    }));

    const { error: aErr } = await supabase.from('answers').insert(answerRows);

    if (aErr) {
      console.error(`  ✗ Failed to insert answers for: ${question.text.substring(0, 50)}...`, aErr.message);
      // Clean up the question
      await supabase.from('questions').delete().eq('id', insertedQ.id);
      failed++;
      continue;
    }

    imported++;
    existingTexts.add(question.text.toLowerCase().trim());

    const answerPreview = question.answers.slice(0, 3).map(a => `${a.text}(${a.points})`).join(', ');
    console.log(`  ✓ [${imported}/${count}] ${question.text.substring(0, 60)}... → ${answerPreview}...`);

    // Rate limit: be nice to the server
    await delay(200);
  }

  console.log(`\n=== Import Complete ===`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped (duplicates): ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total in DB: ${imported + (existing?.length || 0)}`);
}

// Also import from the curated thegame-room.com list
async function importCuratedQuestions() {
  const curated: Array<{ text: string; answers: Array<{ text: string; points: number }> }> = [
    {
      text: "Name a common color for flowers",
      answers: [
        { text: "Red", points: 30 }, { text: "Yellow", points: 20 },
        { text: "Pink", points: 15 }, { text: "White", points: 10 }, { text: "Purple", points: 5 },
      ],
    },
    {
      text: "Name a popular color for a car",
      answers: [
        { text: "Black", points: 34 }, { text: "Red", points: 27 },
        { text: "White", points: 20 }, { text: "Blue", points: 12 }, { text: "Silver", points: 7 },
      ],
    },
    {
      text: "Name a sport played without a ball",
      answers: [
        { text: "Hockey", points: 35 }, { text: "Swimming", points: 25 },
        { text: "Track & Field", points: 15 }, { text: "Gymnastics", points: 12 }, { text: "Wrestling", points: 8 },
      ],
    },
    {
      text: "Name a fast food restaurant",
      answers: [
        { text: "McDonald's", points: 50 }, { text: "Burger King", points: 20 },
        { text: "KFC", points: 15 }, { text: "Subway", points: 10 }, { text: "Taco Bell", points: 5 },
      ],
    },
    {
      text: "Name a musical instrument",
      answers: [
        { text: "Guitar", points: 35 }, { text: "Piano", points: 25 },
        { text: "Drums", points: 20 }, { text: "Violin", points: 10 }, { text: "Flute", points: 10 },
      ],
    },
    {
      text: "Name a popular Christmas song",
      answers: [
        { text: "Jingle Bells", points: 40 }, { text: "Silent Night", points: 25 },
        { text: "White Christmas", points: 15 }, { text: "Deck the Halls", points: 10 },
        { text: "All I Want for Christmas Is You", points: 10 },
      ],
    },
    {
      text: "Name a popular Christmas movie",
      answers: [
        { text: "Home Alone", points: 30 }, { text: "Elf", points: 25 },
        { text: "A Christmas Story", points: 20 }, { text: "It's a Wonderful Life", points: 15 },
        { text: "The Polar Express", points: 10 },
      ],
    },
    {
      text: "Name a famous Disney character",
      answers: [
        { text: "Mickey Mouse", points: 35 }, { text: "Cinderella", points: 25 },
        { text: "Donald Duck", points: 15 }, { text: "Snow White", points: 15 },
        { text: "Winnie the Pooh", points: 10 },
      ],
    },
    {
      text: "Name a type of candy",
      answers: [
        { text: "Chocolate", points: 40 }, { text: "Gummy bears", points: 20 },
        { text: "Lollipop", points: 15 }, { text: "Taffy", points: 10 }, { text: "Hard candy", points: 5 },
      ],
    },
    {
      text: "Name a reason people might dance",
      answers: [
        { text: "Wedding", points: 40 }, { text: "Party", points: 25 },
        { text: "Concert", points: 15 }, { text: "Celebration", points: 10 }, { text: "Exercise", points: 5 },
      ],
    },
  ];

  console.log(`\nImporting ${curated.length} curated questions...`);

  for (const q of curated) {
    const { data: existing } = await supabase
      .from('questions')
      .select('id')
      .ilike('text', q.text)
      .limit(1);

    if (existing && existing.length > 0) continue;

    const { data: insertedQ } = await supabase
      .from('questions')
      .insert({
        text: q.text,
        answer_count: q.answers.length,
        category: 'general',
        difficulty: 'medium',
        source: 'archive',
        fast_money_ok: true,
        tags: ['curated'],
      })
      .select()
      .single();

    if (!insertedQ) continue;

    await supabase.from('answers').insert(
      q.answers.map((a, i) => ({
        question_id: insertedQ.id,
        rank: i + 1,
        text: a.text,
        points: a.points,
        aliases: generateAliases(a.text),
      }))
    );
  }
}

// Main
async function main() {
  // Check env
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Run with: source .env.local && npx tsx scripts/import-questions.ts');
    process.exit(1);
  }

  // Import curated questions first
  await importCuratedQuestions();

  // Import from familyfeudinfo.com — start from the latest ID and work backwards
  await importQuestions(130656, 500);
}

main().catch(console.error);
