# Stream 2: AI Host Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up all existing AI infrastructure so the host speaks, reacts, and the game sounds like a TV show — sound effects trigger, mic input works, TTS reads questions, and the host reacts to every game event.

**Architecture:** Create a `useHostVoice` hook on the TV display that subscribes to game events and orchestrates host-dialogue → TTS → audio playback → sound effects. Plug in the existing MicButton component. All APIs already exist — this is a wiring/integration task.

**Tech Stack:** Next.js, Supabase Realtime, Google TTS, Gemini Flash, Web Audio API, Zustand

---

### Task 1: Wire Sound Effects to Game Events

**Files:**
- Modify: `src/components/tv/GameBoard.tsx`

- [ ] **Step 1: Import useAudio and trigger sounds**

Add sound effects to GameBoard for all game events:

```typescript
import { useAudio } from '@/hooks/useAudio';

// Inside GameBoard component:
const { play } = useAudio();

// When strikes increase (existing useEffect around line 61):
useEffect(() => {
  if (currentRound && currentRound.strikes > lastStrikeCount) {
    play('strike'); // ADD THIS
    setShowStrike(true);
    setLastStrikeCount(currentRound.strikes);
  }
}, [currentRound?.strikes, lastStrikeCount, play]);

// When a new answer is revealed:
const prevRevealedRef = useRef<number[]>([]);
useEffect(() => {
  if (!currentRound) return;
  const prev = prevRevealedRef.current;
  const curr = currentRound.revealed;
  if (curr.length > prev.length) {
    play('ding'); // New tile flipped!
  }
  prevRevealedRef.current = curr;
}, [currentRound?.revealed, play]);
```

- [ ] **Step 2: Add theme music on game start**

```typescript
// When GameBoard first mounts (game just started):
useEffect(() => {
  play('theme');
}, []); // Play once on mount
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: wire sound effects to game events (ding, strike, theme)"
```

---

### Task 2: Plug In MicButton to AnswerScreen

**Files:**
- Modify: `src/components/phone/AnswerScreen.tsx:133-144`

- [ ] **Step 1: Replace disabled placeholder with real MicButton**

Import and use the real MicButton component:

```typescript
import { MicButton } from './MicButton';

// Replace lines 133-144 (the disabled placeholder) with:
<div className="mt-8">
  <MicButton
    onTranscript={(text) => {
      setAnswer(text);
      submitAnswer(text);
    }}
    disabled={submitted || submitting}
  />
  <p className="text-white/40 text-xs text-center mt-2">Hold to speak</p>
</div>
```

This connects the fully-built MicButton (push-to-talk → STT → transcript) to the answer submission flow.

- [ ] **Step 2: Also add MicButton to StealHuddleScreen**

In `StealHuddleScreen.tsx`, add MicButton for the designated stealer alongside the text input:

```typescript
{isDesignatedStealer && (
  <div className="flex flex-col items-center gap-3">
    <MicButton
      onTranscript={(text) => {
        setStealAnswer(text);
        // Don't auto-submit steal — let them confirm
      }}
    />
    {/* existing text input and submit button */}
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: plug in MicButton for voice answers in AnswerScreen and StealHuddle"
```

---

### Task 3: Create useHostVoice Hook

**Files:**
- Create: `src/hooks/useHostVoice.ts`

- [ ] **Step 1: Create the hook**

This hook runs on the TV display only. It listens for game events and generates + plays host dialogue.

```typescript
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useAudio } from './useAudio';

interface HostVoiceOptions {
  enabled: boolean;
  gameId: string | null;
}

export function useHostVoice({ enabled, gameId }: HostVoiceOptions) {
  const { play, playHostLine, stopAll } = useAudio();
  const { currentRound, teams, players, game } = useGameStore();
  const lastEventRef = useRef<string>('');

  const generateAndSpeak = useCallback(async (
    eventType: string,
    context: Record<string, any>,
  ) => {
    if (!enabled) return;

    // Avoid duplicate calls for the same event
    const eventKey = `${eventType}:${JSON.stringify(context)}`;
    if (lastEventRef.current === eventKey) return;
    lastEventRef.current = eventKey;

    try {
      // 1. Generate host dialogue
      const dialogueRes = await fetch('/api/host-dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_type: eventType, context }),
      });
      const { dialogue } = await dialogueRes.json();
      if (!dialogue) return;

      // 2. Generate TTS audio
      const ttsRes = await fetch('/api/tts-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: dialogue,
          voice: game?.settings?.host_voice || 'en-US-Neural2-D',
        }),
      });
      const { audio_base64 } = await ttsRes.json();
      if (!audio_base64) return;

      // 3. Play the audio
      const audioUrl = `data:audio/mp3;base64,${audio_base64}`;
      playHostLine(audioUrl);
    } catch (err) {
      console.warn('Host voice error:', err);
    }
  }, [enabled, game?.settings, playHostLine]);

  return { generateAndSpeak, stopAll };
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: create useHostVoice hook for AI host dialogue + TTS"
```

---

### Task 4: Host Reads Questions & Reacts to Answers

**Files:**
- Modify: `src/components/tv/GameBoard.tsx`

- [ ] **Step 1: Integrate useHostVoice into GameBoard**

```typescript
import { useHostVoice } from '@/hooks/useHostVoice';

// Inside GameBoard:
const { generateAndSpeak } = useHostVoice({
  enabled: true,
  gameId,
});

// When a new question loads (round changes):
useEffect(() => {
  if (!question || !currentRound) return;
  const faceOffPlayers = getFaceOffPlayers();
  if (faceOffPlayers && currentRound.phase === 'face_off') {
    generateAndSpeak('face_off_intro', {
      player1_name: faceOffPlayers.player1.username,
      player2_name: faceOffPlayers.player2.username,
      team1_name: teams[0]?.name,
      team2_name: teams[1]?.name,
    });
    // Then read the question
    setTimeout(() => {
      generateAndSpeak('read_question', {
        question_text: question.text,
        answer_count: answers.length,
      });
    }, 3000); // Wait for intro to finish
  }
}, [question?.id]);

// When a new answer is revealed:
useEffect(() => {
  if (!currentRound) return;
  const revealed = currentRound.revealed;
  if (revealed.length > 0) {
    const lastRank = revealed[revealed.length - 1];
    const answer = answers.find(a => a.rank === lastRank);
    if (answer) {
      generateAndSpeak('correct_answer', {
        answer_text: answer.text,
        rank: answer.rank,
        points: answer.points * (currentRound.point_multiplier || 1),
      });
    }
  }
}, [currentRound?.revealed?.length]);

// When strikes increase:
useEffect(() => {
  if (currentRound && currentRound.strikes > 0) {
    generateAndSpeak('wrong_answer', {
      strikes: currentRound.strikes,
    });
  }
}, [currentRound?.strikes]);
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: AI host reads questions and reacts to answers via TTS"
```

---

### Task 5: Add Sound Effects to FastMoneyBoard

**Files:**
- Modify: `src/components/tv/FastMoneyBoard.tsx`
- Modify: `src/components/tv/ConfettiOverlay.tsx`

- [ ] **Step 1: Add celebration sounds and confetti**

```typescript
import { useAudio } from '@/hooks/useAudio';
import { ConfettiOverlay } from './ConfettiOverlay';

// Inside FastMoneyBoard:
const { play } = useAudio();
const [showConfetti, setShowConfetti] = useState(false);

// When combined_total crosses 200:
useEffect(() => {
  if (fastMoney && fastMoney.combined_total >= 200 && !showConfetti) {
    play('confetti');
    play('applause');
    setShowConfetti(true);
  }
}, [fastMoney?.combined_total]);

// In the JSX, add ConfettiOverlay:
<ConfettiOverlay active={showConfetti} />
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: Fast Money celebration with confetti and applause at 200+ points"
```

---

### Task 6: Host Override Panel Actually Works

**Files:**
- Modify: `src/components/phone/PhoneController.tsx`

- [ ] **Step 1: Track last answer result and pass to HostOverridePanel**

```typescript
// Add state for last answer tracking:
const [lastAnswer, setLastAnswer] = useState<{
  playerId: string | null;
  isCorrect: boolean | null;
}>({ playerId: null, isCorrect: null });

// Listen to player_answers table for new inserts:
// (Use a useEffect with Realtime subscription)
// When a new player_answer is inserted for this round,
// update lastAnswer state

// Pass to HostOverridePanel:
{isHost && currentRound && (
  <HostOverridePanel
    roundId={currentRound.id}
    lastAnswerPlayerId={lastAnswer.playerId}
    lastAnswerCorrect={lastAnswer.isCorrect}
  />
)}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: host override panel shows after each answer judgment"
```

---

### Task 7: Improve Gemini Judge Prompt with Few-Shot Examples

**Files:**
- Modify: `src/app/api/judge-answer/route.ts`

- [ ] **Step 1: Add few-shot examples to Gemini prompt**

Replace the simple prompt with one that includes calibration examples:

```typescript
const geminiPrompt = `You are a Family Feud answer judge. Given a survey question, the list of correct board answers, and a player's spoken answer, determine if the player's answer matches any board answer.

Examples:
- Question: "Name a vehicle" → Player: "automobile" → Match: "Car" (synonym)
- Question: "Name a fruit" → Player: "TV" → Match: NO MATCH (unrelated)
- Question: "Name something at the beach" → Player: "sunblock" → Match: "Sunscreen" (same product)
- Question: "Name a place to swim" → Player: "ocean" → Match: NO MATCH (ocean ≠ swimming pool)
- Question: "Name a pet" → Player: "doggy" → Match: "Dog" (informal name)

Be generous — Family Feud accepts reasonable interpretations. But don't stretch — the answer must genuinely mean the same thing.

Question: "${questionText}"
Board answers: [${answerTexts.join(', ')}]
Player said: "${rawText}"

Respond with ONLY the exact text of the matching board answer, or "NO MATCH".`;
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: improve Gemini judge with few-shot calibration examples"
```

---

### Task 8: Host Score & Round Transition Announcements

**Files:**
- Modify: `src/components/tv/GameBoard.tsx`

- [ ] **Step 1: Add round completion announcement**

```typescript
// When round phase changes to 'complete':
useEffect(() => {
  if (currentRound?.phase === 'complete') {
    generateAndSpeak('round_complete', {
      round_number: currentRound.round_number,
      team1_name: teams[0]?.name,
      team1_score: teams[0]?.score,
      team2_name: teams[1]?.name,
      team2_score: teams[1]?.score,
    });
  }
}, [currentRound?.phase]);

// When game status changes to 'finished':
useEffect(() => {
  if (game?.status === 'finished' && teams.length >= 2) {
    const winner = teams[0].score > teams[1].score ? teams[0] : teams[1];
    play('applause');
    generateAndSpeak('game_over', {
      winner_name: winner.name,
      winner_score: winner.score,
    });
  }
}, [game?.status]);
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: AI host announces scores and round transitions"
```

---

### Task 9: Sequential Fast Money Reveal (Not Instant)

**Files:**
- Modify: `src/components/tv/FastMoneyBoard.tsx`

- [ ] **Step 1: Implement sequential reveal with revealIndex**

The component already has `revealIndex` state (line 17) but never uses it. Wire it up:

```typescript
const [revealIndex, setRevealIndex] = useState(-1);

// When status changes to 'reveal', start sequential reveal
useEffect(() => {
  if (fastMoney?.status !== 'reveal') return;
  if (revealIndex >= 0) return; // Already revealing

  // Start reveal sequence — advance every 4 seconds
  let idx = 0;
  const interval = setInterval(() => {
    setRevealIndex(idx);
    idx++;
    if (idx >= 10) { // 5 questions × 2 players
      clearInterval(interval);
    }
  }, 4000);

  return () => clearInterval(interval);
}, [fastMoney?.status]);

// In the render, only show answers up to revealIndex:
// revealIndex 0 = Q1 Player 1, 1 = Q1 Player 2, 2 = Q2 Player 1, etc.
const p1Idx = Math.floor(revealIndex / 2); // Which question for P1
const p2Idx = Math.floor((revealIndex - 1) / 2); // Which question for P2
const showP1 = (qIdx: number) => revealIndex >= qIdx * 2;
const showP2 = (qIdx: number) => revealIndex >= qIdx * 2 + 1;
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: sequential Fast Money reveal with 4-second pacing"
```

---

### Task 10: Host Memory for Callbacks

**Files:**
- Create: `src/app/api/host-memory/route.ts`
- Modify: `src/app/api/host-dialogue/route.ts`

- [ ] **Step 1: Create host_memory table**

```sql
CREATE TABLE IF NOT EXISTS host_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  dialogue text NOT NULL,
  context jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_host_memory_game ON host_memory(game_id);
ALTER TABLE host_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read host memory" ON host_memory FOR SELECT USING (true);
CREATE POLICY "API can insert host memory" ON host_memory FOR INSERT WITH CHECK (true);
```

- [ ] **Step 2: Modify host-dialogue to store and recall memories**

In `host-dialogue/route.ts`, before calling Gemini:
```typescript
// Fetch recent memories for this game
const { data: memories } = await supabase
  .from('host_memory')
  .select('event_type, dialogue, context')
  .eq('game_id', game_id)
  .order('created_at', { ascending: false })
  .limit(15);

// Include in Gemini prompt as conversation history
const memoryContext = memories?.map(m =>
  `[${m.event_type}] ${m.dialogue}`
).join('\n') || '';

// Add to system prompt:
const enrichedPrompt = HOST_PERSONALITY +
  `\n\nRecent game history (use for callbacks and references):\n${memoryContext}`;
```

After generating dialogue, store it:
```typescript
await supabase.from('host_memory').insert({
  game_id, event_type, dialogue, context,
});
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: host memory table enables callbacks to earlier game events"
```
