# Family Feud AI-Powered Web App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete web-based Family Feud game where players join via phone, an AI host runs the show, and a TV display shows the game board — all backed by Supabase and Google Cloud AI services.

**Architecture:** Next.js 14 App Router PWA with two views: phone controller (player input) and TV display (game board). Supabase handles auth (anonymous sessions), Postgres database, Realtime subscriptions, Edge Functions for server-side game logic, and Storage for cached audio. Google Cloud provides STT, TTS, and Gemini for answer judging and host dialogue.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase (Auth, DB, Realtime, Edge Functions, Storage), Google Cloud STT/TTS, Gemini API, Zustand (state management), Framer Motion (animations)

---

## Phase 1: Project Foundation + Core UI

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`, `next.config.js`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `public/manifest.json`
- Create: `.env.local.example`

- [ ] **Step 1: Scaffold Next.js with TypeScript + Tailwind**

```bash
cd /Users/coreyduke/Desktop/Family-Feud
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

- [ ] **Step 2: Install core dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr zustand framer-motion qrcode.react uuid
npm install -D @types/uuid supabase
```

- [ ] **Step 3: Create PWA manifest**

`public/manifest.json`:
```json
{
  "name": "Family Feud",
  "short_name": "Feud",
  "description": "AI-Powered Family Feud Game",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a2e",
  "theme_color": "#e63946",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 4: Create .env.local.example**

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_CREDENTIALS=base64-encoded-credentials
GEMINI_API_KEY=your-gemini-key
```

- [ ] **Step 5: Verify dev server starts**

```bash
npm run dev
```

- [ ] **Step 6: Commit**

```bash
git init && git add -A && git commit -m "feat: initialize Next.js project with TypeScript, Tailwind, and dependencies"
```

---

### Task 2: Database Types + Supabase Client

**Files:**
- Create: `src/types/game.ts`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/types.ts`
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Define TypeScript game types**

`src/types/game.ts` — All game entities matching the Postgres schema: Game, Player, Team, TeamMember, Question, Answer, Round, PlayerAnswer, FastMoney, BuzzerEvent. Plus enums for GameStatus, RoundPhase, FastMoneyStatus, PhoneUIState.

- [ ] **Step 2: Create Supabase database types**

`src/lib/supabase/types.ts` — Supabase Database type definition matching all tables.

- [ ] **Step 3: Create Supabase browser client**

`src/lib/supabase/client.ts` — createBrowserClient using `@supabase/ssr`.

- [ ] **Step 4: Create Supabase server client**

`src/lib/supabase/server.ts` — createServerClient for server components and API routes.

- [ ] **Step 5: Create initial migration**

`supabase/migrations/001_initial_schema.sql` — All CREATE TABLE statements from plan.md Section 2, plus RLS policies, indexes, and Realtime enable statements.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add database schema, types, and Supabase client setup"
```

---

### Task 3: Global Layout + Theme

**Files:**
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx` (landing page)
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Card.tsx`
- Create: `src/components/ui/Input.tsx`
- Create: `src/components/ui/Timer.tsx`

- [ ] **Step 1: Set up Tailwind theme with Family Feud colors**

Custom colors: primary red (#E63946), secondary blue (#457B9D), dark background (#1a1a2e), gold (#FFD700), board-blue (#1D3557).

- [ ] **Step 2: Create shared UI components**

Button (with variants: primary, secondary, buzzer, mic), Card, Input, Timer (countdown with circular progress).

- [ ] **Step 3: Create root layout with PWA meta tags**

- [ ] **Step 4: Create landing page**

Two large buttons: "Host New Game" and "Join Game" with Family Feud styling.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add global theme, shared UI components, and landing page"
```

---

### Task 4: Anonymous Auth + Player Join Flow

**Files:**
- Create: `src/app/join/page.tsx`
- Create: `src/components/lobby/JoinForm.tsx`
- Create: `src/hooks/usePlayer.ts`
- Create: `src/lib/supabase/auth.ts`

- [ ] **Step 1: Create auth helpers**

`src/lib/supabase/auth.ts` — `signInAnonymously()`, `getSession()`, `createPlayer(username, roomCode)`.

- [ ] **Step 2: Create usePlayer hook**

Manages current player state, persists session, handles reconnection on refresh.

- [ ] **Step 3: Create JoinForm component**

Username field + Room Code field + Join button. Validates room code exists, creates anonymous session, inserts player row, redirects to /play.

- [ ] **Step 4: Create /join page**

Responsive phone-optimized layout with JoinForm.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add anonymous auth and player join flow"
```

---

### Task 5: Host Game + Lobby

**Files:**
- Create: `src/app/host/page.tsx`
- Create: `src/components/lobby/Lobby.tsx`
- Create: `src/components/lobby/QRCode.tsx`
- Create: `src/components/lobby/TeamSetup.tsx`
- Create: `src/components/lobby/PlayerList.tsx`
- Create: `src/hooks/useGameState.ts`
- Create: `src/lib/game/room-code.ts`

- [ ] **Step 1: Create room code generator**

`src/lib/game/room-code.ts` — generates 4-letter room codes (e.g., "FEUD"), checks uniqueness against DB.

- [ ] **Step 2: Create useGameState hook**

Subscribes to Supabase Realtime on `games`, `rounds`, `teams`, `players` tables. Exposes full game state with automatic sync.

- [ ] **Step 3: Create Lobby component (TV view)**

Shows room code, QR code, connected players list (updates in real-time). "Start Game" button for host.

- [ ] **Step 4: Create TeamSetup component**

Three assignment modes: manual drag-and-drop, captains pick, full random. Team naming. Randomize player order button.

- [ ] **Step 5: Create /host page**

TV-optimized layout. Shows Lobby → TeamSetup → Game transitions.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add host game creation, lobby with QR code, and team setup"
```

---

### Task 6: Realtime Subscriptions + Game State Store

**Files:**
- Create: `src/stores/gameStore.ts`
- Create: `src/lib/game/state-machine.ts`
- Create: `src/hooks/useRealtimeSync.ts`

- [ ] **Step 1: Create Zustand game store**

Central store with all game state: game, round, teams, players, currentPhase. Actions for updating each piece.

- [ ] **Step 2: Create game state machine**

`src/lib/game/state-machine.ts` — Pure functions defining valid transitions: lobby → face_off → playing → steal → complete. Round advancement. Fast money transitions.

- [ ] **Step 3: Create Realtime sync hook**

`src/hooks/useRealtimeSync.ts` — Subscribes to all relevant tables, updates Zustand store on every change. Handles reconnection with full state fetch fallback.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add Zustand game store, state machine, and realtime sync"
```

---

## Phase 2: Face-Off + Main Round (Text Input)

### Task 7: Game Board TV Display

**Files:**
- Create: `src/components/tv/GameBoard.tsx`
- Create: `src/components/tv/AnswerTile.tsx`
- Create: `src/components/tv/StrikeOverlay.tsx`
- Create: `src/components/tv/Scoreboard.tsx`
- Create: `src/components/tv/FaceOffDisplay.tsx`

- [ ] **Step 1: Create AnswerTile component**

Blue tile that flips to reveal answer text + points. Uses Framer Motion for 3D flip animation. Hidden state shows rank number, revealed state shows text + points.

- [ ] **Step 2: Create GameBoard component**

Displays 4-8 AnswerTiles in a column. Reads from `rounds.revealed` to determine which tiles are flipped. Animates new reveals.

- [ ] **Step 3: Create StrikeOverlay component**

Full-screen red X overlay with buzzer sound. Shows 1-3 X marks based on `rounds.strikes`. Auto-dismisses after 2 seconds.

- [ ] **Step 4: Create Scoreboard component**

Two-team score display at bottom of TV. Animated counting when scores change. Shows team names, colors, and current scores.

- [ ] **Step 5: Create FaceOffDisplay component**

Shows the two Face-Off players' names with VS in between. Highlights the buzzer winner. Shows "waiting for answer" state.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add TV game board with flip tiles, strikes, and scoreboard"
```

---

### Task 8: Phone Controller Views

**Files:**
- Create: `src/app/play/page.tsx`
- Create: `src/components/phone/PhoneController.tsx`
- Create: `src/components/phone/BuzzerScreen.tsx`
- Create: `src/components/phone/AnswerScreen.tsx`
- Create: `src/components/phone/WaitingScreen.tsx`
- Create: `src/components/phone/PlayOrPassScreen.tsx`
- Create: `src/components/phone/StealHuddleScreen.tsx`
- Create: `src/components/phone/TeamChatScreen.tsx`

- [ ] **Step 1: Create PhoneController component**

State machine-driven component that renders the correct screen based on PhoneUIState (from game state + current player context).

- [ ] **Step 2: Create BuzzerScreen**

Giant pulsing button. Disabled until `buzzer_armed` event. Sends buzz to server on tap. Vibration on activation.

- [ ] **Step 3: Create AnswerScreen**

Text input + submit button (mic button placeholder for Phase 3). 10-second countdown timer. Auto-submits on timeout.

- [ ] **Step 4: Create WaitingScreen**

Shows current board state, whose turn it is, team score. No input controls.

- [ ] **Step 5: Create PlayOrPassScreen**

Two large buttons: PLAY and PASS. Only shown to Face-Off winner.

- [ ] **Step 6: Create StealHuddleScreen + TeamChatScreen**

30-second team chat with text messages. Designated player sees "Submit Steal Answer" button.

- [ ] **Step 7: Create /play page**

Wraps PhoneController with auth check and game state sync.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: add phone controller with buzzer, answer, waiting, and steal screens"
```

---

### Task 9: Buzzer Edge Function

**Files:**
- Create: `supabase/functions/handle-buzz/index.ts`

- [ ] **Step 1: Implement handle-buzz Edge Function**

Receives `{ round_id, player_id, team_id, client_ts }`. Records server timestamp. Checks for existing winner. Returns `{ status: "winner"|"second", answer_window_seconds: 10 }`. Race-condition safe using Postgres row-level locking.

- [ ] **Step 2: Wire BuzzerScreen to Edge Function**

PhoneController calls handle-buzz on buzzer tap. Handles winner/second responses. Transitions to AnswerScreen for winner.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add buzzer edge function with server-side arbitration"
```

---

### Task 10: Answer Matching Engine

**Files:**
- Create: `src/lib/game/answer-matching.ts`
- Create: `src/lib/game/text-normalize.ts`
- Create: `supabase/functions/judge-answer/index.ts`
- Create: `supabase/functions/_shared/normalize.ts`
- Create: `supabase/functions/_shared/phonetic.ts`
- Create: `supabase/functions/_shared/gemini.ts`

- [ ] **Step 1: Create text normalization utilities**

Strip punctuation, lowercase, remove articles ("a", "an", "the"), basic stemming (plural → singular), trim whitespace.

- [ ] **Step 2: Create phonetic matching**

Soundex and Metaphone implementations for catching STT transcription errors and misspellings.

- [ ] **Step 3: Create Gemini semantic judge**

Call Gemini Flash with structured prompt from plan.md Section 6. Temperature 0.0 for deterministic results. Returns matched answer text or "NO MATCH".

- [ ] **Step 4: Implement judge-answer Edge Function**

3-tier pipeline: exact/normalized match → phonetic match → Gemini semantic judgment. Writes result to `player_answers`. Updates `rounds.revealed` and strike count. Handles duplicate detection (already-revealed answers don't count as strikes).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add 3-tier answer matching engine with Gemini fallback"
```

---

### Task 11: Face-Off Game Flow

**Files:**
- Create: `supabase/functions/advance-round/index.ts`
- Modify: `src/components/tv/GameBoard.tsx`
- Modify: `src/components/phone/PhoneController.tsx`

- [ ] **Step 1: Implement advance-round Edge Function**

Handles all phase transitions: face_off → playing → steal → complete. Determines Face-Off winner (higher-ranked answer). Handles Play/Pass choice. Applies point multipliers (1x, 1x, 2x, 3x). Awards points to correct team at round end. Advances to next round or Fast Money.

- [ ] **Step 2: Wire Face-Off flow end-to-end**

TV shows question → buzzers arm → winner buzzes → answer window → second player answers → control decision → Play/Pass.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add Face-Off game flow with phase transitions"
```

---

### Task 12: Main Round Game Flow

**Files:**
- Modify: `src/components/phone/PhoneController.tsx`
- Modify: `src/components/tv/GameBoard.tsx`
- Modify: `supabase/functions/advance-round/index.ts`

- [ ] **Step 1: Implement turn rotation**

After Play/Pass, controlling team answers in `player_order` sequence. Track current turn index. Cycle back to start when reaching end of team.

- [ ] **Step 2: Implement strike accumulation**

Track strikes (0-3). On 3 strikes, lock out controlling team and trigger steal opportunity.

- [ ] **Step 3: Implement steal flow**

Opposing team gets 30-second huddle (team chat). Designated player submits one steal answer. If correct, stealing team gets all round points. If wrong, controlling team gets all points.

- [ ] **Step 4: Implement round completion**

Award multiplied points to winning team. Update scoreboard. Check if game should advance to next round or Fast Money. Handle tied scores with Sudden Death.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add main round with turn rotation, strikes, and steal mechanics"
```

---

### Task 13: Question Database + Seeding

**Files:**
- Create: `supabase/seed.sql`
- Create: `scripts/seed-questions.ts`

- [ ] **Step 1: Create 100 curated questions with answers**

Each question has 4-8 answers with point distributions summing to ~100. Include aliases for common synonyms. Cover diverse categories: food, travel, household, holidays, family, work, animals, etc.

- [ ] **Step 2: Create seed script**

Inserts all questions and answers into Supabase. Idempotent (can re-run safely).

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add 100 curated questions with answers and seed script"
```

---

## Phase 3: AI Voice Integration

### Task 14: Text-to-Speech Integration

**Files:**
- Create: `supabase/functions/tts-generate/index.ts`
- Create: `src/lib/audio/player.ts`
- Create: `src/hooks/useAudio.ts`
- Create: `src/components/tv/AudioHost.tsx`

- [ ] **Step 1: Implement tts-generate Edge Function**

Calls Google Cloud TTS with SSML. Caches audio in Supabase Storage (`tts-cache` bucket). Returns audio URL. Supports multiple voices (Neural2-D, F, A, C).

- [ ] **Step 2: Create audio player utility**

Web Audio API wrapper. Plays audio from URL. Supports queue for sequential lines. Volume control. Fires completion events.

- [ ] **Step 3: Create useAudio hook**

Manages audio playback state. Queues host dialogue. Triggers game events on audio completion (e.g., arm buzzers when question reading finishes).

- [ ] **Step 4: Pre-cache common phrases**

Script to generate and upload common host phrases: "Good answer!", "Strike!", "Survey says...", "Let's play the Feud!", etc.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add TTS integration with audio caching and playback"
```

---

### Task 15: Speech-to-Text Integration

**Files:**
- Create: `supabase/functions/stt-transcribe/index.ts`
- Create: `src/lib/audio/recorder.ts`
- Create: `src/hooks/useRecorder.ts`
- Create: `src/components/phone/MicButton.tsx`

- [ ] **Step 1: Implement stt-transcribe Edge Function**

Receives audio blob (WebM/Opus). Streams to Google Cloud STT. Returns transcript. Single-utterance mode. Auto-punctuation enabled.

- [ ] **Step 2: Create audio recorder utility**

Uses MediaRecorder API. Captures WebM/Opus audio. Push-to-talk: records while button held. Auto-stops at timeout.

- [ ] **Step 3: Create MicButton component**

Large push-to-talk button with visual feedback (recording indicator, waveform). Countdown timer overlay. Sends audio to stt-transcribe on release. Falls back to text input.

- [ ] **Step 4: Integrate MicButton into AnswerScreen**

Replace text-only input with MicButton + text fallback. Transcript flows to judge-answer.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add STT integration with push-to-talk mic button"
```

---

### Task 16: Sound Effects Library

**Files:**
- Create: `public/sounds/ding.mp3`
- Create: `public/sounds/buzzer.mp3`
- Create: `public/sounds/strike.mp3`
- Create: `public/sounds/theme.mp3`
- Create: `public/sounds/applause.mp3`
- Create: `public/sounds/confetti.mp3`
- Create: `src/lib/audio/sounds.ts`

- [ ] **Step 1: Create sound effects manager**

Preloads all sound effects. Plays on game events: ding (correct answer), buzzer (wrong answer), strike (X), theme (game start), applause (round win), confetti (Fast Money win).

- [ ] **Step 2: Wire sound effects to game events**

AnswerTile flip → ding. StrikeOverlay → buzzer. Game start → theme. Steal success → applause.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add sound effects library and wire to game events"
```

---

## Phase 4: ADK Agent Host

### Task 17: AI Host Agent

**Files:**
- Create: `supabase/functions/host-dialogue/index.ts`
- Create: `supabase/functions/_shared/host-agent.ts`
- Create: `src/components/tv/HostAvatar.tsx`

- [ ] **Step 1: Create host agent**

Gemini Flash agent with personality prompt from plan.md. Temperature 0.8 for varied responses. Tools: read_question, judge_answer, reveal_answer, add_strike, update_score, play_sound, advance_phase, get_game_state, get_player_history.

- [ ] **Step 2: Implement host-dialogue Edge Function**

Receives game event context. Invokes host agent. Returns dialogue text. Passes to TTS. Stores conversation history in `host_memory` table.

- [ ] **Step 3: Create HostAvatar component**

Animated avatar on TV display. Lip-syncs loosely with TTS audio. Shows speaking/idle states.

- [ ] **Step 4: Wire host into game flow**

Host announces Face-Off players, reads questions, reacts to answers, announces scores, handles transitions.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add AI host agent with dynamic dialogue and TTS"
```

---

### Task 18: Host Voice Selection + Settings

**Files:**
- Create: `src/components/lobby/GameSettings.tsx`
- Modify: `src/components/lobby/Lobby.tsx`

- [ ] **Step 1: Create GameSettings component**

Host voice selection (4 options with preview). Total rounds (3-5). Answer window duration (8/10/15/20 seconds). Custom questions toggle.

- [ ] **Step 2: Integrate into lobby**

Settings accessible from lobby. Stored in `games.settings` JSONB column. Applied throughout game.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add game settings with host voice selection"
```

---

## Phase 5: Fast Money

### Task 19: Fast Money Setup

**Files:**
- Create: `supabase/functions/start-fast-money/index.ts`
- Create: `src/components/phone/FastMoneyPlayerSelect.tsx`
- Create: `src/components/phone/SequesterScreen.tsx`

- [ ] **Step 1: Implement start-fast-money Edge Function**

Selects 5 questions (different from main rounds). Creates `fast_money` row. Sets status to `player1_playing`.

- [ ] **Step 2: Create player selection screen**

Winning team picks 2 players and their order. Player 1 = first (20s), Player 2 = second (25s).

- [ ] **Step 3: Create SequesterScreen**

Locked screen for Player 2. Solid color background, animated waiting graphic. No game info visible. Music plays through phone speaker.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add Fast Money setup with player selection and sequester"
```

---

### Task 20: Fast Money Gameplay

**Files:**
- Create: `src/components/phone/FastMoneyActiveScreen.tsx`
- Create: `src/components/tv/FastMoneyBoard.tsx`
- Modify: `supabase/functions/judge-answer/index.ts`

- [ ] **Step 1: Create FastMoneyActiveScreen**

Rapid-fire question display. Mic button + text input. 20-second (Player 1) or 25-second (Player 2) master timer. 5-second per-question nudge timer. Auto-advance on timeout.

- [ ] **Step 2: Create FastMoneyBoard (TV)**

Five rows, two columns (Player 1 left, Player 2 right). Shows "[LOCKED]" during gameplay. Running total at bottom.

- [ ] **Step 3: Add duplicate detection for Player 2**

When Player 2 answers same as Player 1, immediately prompt "Try again!". Clock doesn't pause.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add Fast Money gameplay with timer and duplicate detection"
```

---

### Task 21: Fast Money Grand Reveal

**Files:**
- Create: `src/components/tv/FastMoneyReveal.tsx`
- Create: `src/components/tv/ConfettiOverlay.tsx`

- [ ] **Step 1: Create FastMoneyReveal component**

Question-by-question reveal with dramatic pacing. 2-second pause before each point reveal. Running total animation. Player 1 answer → points → Player 2 answer → points.

- [ ] **Step 2: Create ConfettiOverlay**

Full-screen confetti + victory music when total hits 200+. Canvas-based particle system.

- [ ] **Step 3: Wire 200-point celebration**

AI host goes wild on hitting 200. Confetti + music + celebration animation. Under 200: consolation dialogue.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add Fast Money grand reveal with confetti celebration"
```

---

## Phase 6: Content Pipeline + Polish

### Task 22: Host Override Panel

**Files:**
- Create: `src/components/phone/HostOverridePanel.tsx`
- Modify: `src/components/phone/PhoneController.tsx`

- [ ] **Step 1: Create HostOverridePanel**

Only visible on host's phone. After each answer judgment: Force Accept and Force Reject buttons. Triggers immediate correction: board flip/un-flip, score adjustment, host dialogue correction.

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add host override panel for answer corrections"
```

---

### Task 23: Custom Question Creator

**Files:**
- Create: `src/components/lobby/QuestionCreator.tsx`
- Modify: `src/components/lobby/GameSettings.tsx`

- [ ] **Step 1: Create QuestionCreator component**

Host types question, enters 4-8 answers with point values. Validates points sum to ~100. Saves with `source = 'custom'`. Accessible from lobby settings.

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add custom question creator for host"
```

---

### Task 24: AI Question Generation Pipeline

**Files:**
- Create: `scripts/generate-questions.ts`

- [ ] **Step 1: Create question generation script**

Uses Gemini 2.5 Pro to generate questions with realistic survey distributions. Validates with second Gemini call. Inserts validated questions into Supabase with `source = 'generated'`.

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add AI question generation pipeline"
```

---

### Task 25: Game Over + Post-Game

**Files:**
- Create: `src/components/tv/GameOverScreen.tsx`
- Create: `src/components/phone/GameOverPhone.tsx`

- [ ] **Step 1: Create GameOverScreen (TV)**

Final scores with celebration for winner. Highlight reel: best answers, biggest steals, funniest moments. MVP award.

- [ ] **Step 2: Create GameOverPhone**

Final scores on phone. "Play Again?" button that creates a new game with same players.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add game over screen with highlights and play again"
```

---

### Task 26: Performance + Polish

**Files:**
- Modify: various

- [ ] **Step 1: Add Realtime reconnection with REST fallback**

Heartbeat check every 10 seconds. If no Realtime event received, poll via REST. Auto-reconnect on connection drop.

- [ ] **Step 2: Optimize audio latency**

Pre-warm Edge Functions during lobby. Pre-cache TTS for current question. Buffer next question's audio.

- [ ] **Step 3: Add loading states and error boundaries**

Skeleton loaders for game board. Error boundaries with retry. Connection status indicator on phones.

- [ ] **Step 4: Responsive design polish**

Test on iPhone SE (smallest), iPad, and 1080p TV. Adjust font sizes, button sizes, and layouts.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add performance optimizations and UI polish"
```
