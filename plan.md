# Family Feud: AI-Powered Web Application — Complete Design Plan (v2)

---

## Executive Summary

This document outlines the complete architecture, game flow, data strategy, and implementation plan for a web-based Family Feud game powered by Google Cloud AI services and backed by Supabase for authentication, real-time state management, and persistent storage. Every player joins on their own phone by visiting a URL and logging in with a username. Supabase manages teams, player order, answer validation, and score tracking. The AI host — built on Google's Agent Development Kit — reads questions aloud, listens to spoken answers through each player's phone microphone, and enforces every rule exactly as it works on the television show.

---

## 1. Player Login and Session Join — The Phone Experience

Every player interacts with the game through their own phone's browser. No app install. No account creation friction. Just a URL and a name.

### Login Flow

1. **The game organizer** opens the app on the living room TV (laptop cast to TV, smart TV browser, or any large screen). They click "Host New Game." Supabase creates a new game row and generates a short room code (e.g., `FEUD`). A QR code and the URL `yourapp.com/join` are displayed on the TV.

2. **Each family member** pulls out their phone, scans the QR code or types the URL. They land on a simple join screen with two fields: **Username** (their display name — "Uncle Steve", "Mom", "Little Jess") and the **Room Code**. They tap "Join Game."

3. **Behind the scenes**, Supabase Auth creates an anonymous session for the player. The username is stored in the `players` table linked to that session. Anonymous auth means no email, no password, no OAuth — just a device-bound session that lasts for the game. If someone refreshes their phone, the session persists and they rejoin seamlessly.

4. **The TV screen** updates in real-time (via Supabase Realtime subscriptions on the `players` table) as each person joins. Names appear in a lobby list as they connect.

### Why Supabase Auth (Anonymous Sessions)

The goal is zero friction. Family members range from tech-savvy teenagers to grandparents who have never heard of OAuth. Anonymous auth gives every device a unique identity without asking for credentials. Supabase stores the session JWT in the phone's browser, so a page refresh doesn't kick them out. If you later want persistent accounts (to track lifetime stats across game nights), players can upgrade their anonymous session to a full account by adding an email — but that's optional and never required.

### Team Assignment and Randomized Player Order

Once everyone has joined (the TV lobby shows all connected players), the organizer assigns teams. The app offers three methods:

- **Manual drag-and-drop** — The organizer drags names into Team 1 or Team 2 columns on the TV screen
- **Captains pick** — Two designated captains alternate picking players (schoolyard style)
- **Full random** — The app shuffles all players and splits them evenly

After teams are locked, **the app randomizes the play order within each team**. This shuffled order determines:

- Who faces off against whom in each round's Face-Off (Player 1 from Team A vs. Player 1 from Team B, then Player 2 vs. Player 2 in the next round, and so on)
- The rotation order during Main Rounds (after the Face-Off winner's team takes control, the next player in the shuffled order answers, then the next, cycling back to the start)
- Who is eligible for Fast Money selection (the winning team picks two from their roster)

The randomized order is stored in the Supabase `teams` table as an ordered array of player IDs. This order stays fixed for the entire game so everyone knows when their turn is coming.

---

## 2. Supabase — The Backend Brain

Supabase replaces a custom backend for all persistent data, authentication, and real-time synchronization. It provides a Postgres database, Row Level Security, real-time subscriptions via WebSocket, and Edge Functions for server-side logic — everything the game needs.

### Why Supabase Over Firestore

- **Relational data model.** Family Feud has inherently relational data: players belong to teams, teams belong to games, rounds reference questions, answers reference rounds. Postgres handles this cleanly with foreign keys and joins, where Firestore would require denormalization and redundant writes.
- **Row Level Security (RLS).** We can write security policies like "players can only update their own answer row" and "only the game host can advance the game phase" directly in the database. No separate security rules file.
- **Realtime.** Supabase Realtime broadcasts INSERT, UPDATE, and DELETE events on any table. Every phone subscribes to changes on the game's state row — when the phase changes, scores update, or an answer is revealed, every device gets the update within 50-100ms.
- **Edge Functions.** Server-side TypeScript functions running on Deno at the edge. These handle the logic that shouldn't run on the client: answer validation, score calculation, buzz-in arbitration, and calls to Google Cloud APIs (STT, TTS, Gemini, ADK).
- **Built-in Auth.** Anonymous sessions, session persistence, and optional upgrade to email/password — all out of the box with Supabase Auth.

### Database Schema

```sql
-- ============================================================
-- AUTHENTICATION (handled by Supabase Auth, schema: auth)
-- Anonymous sessions auto-created on join
-- ============================================================

-- ============================================================
-- PLAYERS
-- ============================================================
create table players (
  id            uuid primary key default gen_random_uuid(),
  auth_id       uuid references auth.users(id) on delete cascade,
  username      text not null,
  avatar_color  text,  -- auto-assigned hex color for UI
  created_at    timestamptz default now()
);

-- ============================================================
-- GAMES
-- ============================================================
create table games (
  id            uuid primary key default gen_random_uuid(),
  room_code     text unique not null,       -- e.g. 'FEUD'
  host_player   uuid references players(id),
  status        text not null default 'lobby',
                -- lobby → face_off → main_round → fast_money → finished
  current_round int default 0,
  settings      jsonb default '{
    "total_rounds": 4,
    "host_voice": "en-US-Neural2-D",
    "include_custom_questions": true
  }'::jsonb,
  created_at    timestamptz default now()
);

-- ============================================================
-- TEAMS
-- ============================================================
create table teams (
  id            uuid primary key default gen_random_uuid(),
  game_id       uuid references games(id) on delete cascade,
  name          text not null,              -- "The Johnsons"
  color         text not null,              -- '#E63946' or '#457B9D'
  score         int default 0,
  player_order  uuid[] not null default '{}',
                -- randomized array of player IDs — THIS is the play order
  created_at    timestamptz default now()
);

-- ============================================================
-- TEAM MEMBERS (join table)
-- ============================================================
create table team_members (
  player_id     uuid references players(id) on delete cascade,
  team_id       uuid references teams(id) on delete cascade,
  game_id       uuid references games(id) on delete cascade,
  primary key (player_id, game_id)
);

-- ============================================================
-- QUESTIONS
-- ============================================================
create table questions (
  id              uuid primary key default gen_random_uuid(),
  text            text not null,
  answer_count    int not null,
  category        text,
  difficulty      text default 'medium',
  source          text,                     -- 'archive', 'generated', 'custom'
  source_detail   text,
  fast_money_ok   boolean default true,
  times_used      int default 0,
  tags            text[],
  created_at      timestamptz default now()
);

-- ============================================================
-- ANSWERS (one row per answer per question)
-- ============================================================
create table answers (
  id            uuid primary key default gen_random_uuid(),
  question_id   uuid references questions(id) on delete cascade,
  rank          int not null,               -- 1 = top answer
  text          text not null,              -- canonical display text
  points        int not null,               -- survey points (all answers sum to ~100)
  aliases       text[] default '{}',        -- known synonym list for Tier 1-2 matching
  unique (question_id, rank)
);

-- ============================================================
-- ROUNDS
-- ============================================================
create table rounds (
  id              uuid primary key default gen_random_uuid(),
  game_id         uuid references games(id) on delete cascade,
  round_number    int not null,
  question_id     uuid references questions(id),
  phase           text default 'face_off',
                  -- face_off → playing → steal → complete
  controlling_team uuid references teams(id),
  point_multiplier int default 1,           -- 1×, 2×, or 3×
  strikes         int default 0,
  revealed        int[] default '{}',       -- array of answer ranks that have been flipped
  face_off_winner uuid references players(id),
  created_at      timestamptz default now()
);

-- ============================================================
-- PLAYER ANSWERS (every answer attempt, for history and replay)
-- ============================================================
create table player_answers (
  id            uuid primary key default gen_random_uuid(),
  round_id      uuid references rounds(id) on delete cascade,
  player_id     uuid references players(id),
  team_id       uuid references teams(id),
  raw_text      text not null,              -- exactly what STT transcribed
  matched_rank  int,                        -- which answer it matched (null = strike)
  is_correct    boolean not null,
  is_steal      boolean default false,
  is_fast_money boolean default false,
  phase         text,                       -- 'face_off', 'playing', 'steal', 'fast_money'
  answered_at   timestamptz default now()
);

-- ============================================================
-- FAST MONEY
-- ============================================================
create table fast_money (
  id            uuid primary key default gen_random_uuid(),
  game_id       uuid references games(id) on delete cascade,
  player1_id    uuid references players(id),
  player2_id    uuid references players(id),
  questions     uuid[] not null,            -- ordered array of 5 question IDs
  player1_answers jsonb default '[]',       -- [{question_id, raw_text, matched_rank, points}]
  player2_answers jsonb default '[]',
  player1_total int default 0,
  player2_total int default 0,
  combined_total int default 0,
  status        text default 'player1_playing',
                -- player1_playing → player2_sequestered → player2_playing → reveal → complete
  created_at    timestamptz default now()
);

-- ============================================================
-- BUZZER EVENTS (for Face-Off arbitration)
-- ============================================================
create table buzzer_events (
  id            uuid primary key default gen_random_uuid(),
  round_id      uuid references rounds(id) on delete cascade,
  player_id     uuid references players(id),
  team_id       uuid references teams(id),
  buzzed_at     timestamptz not null,       -- server-side timestamp (authoritative)
  client_ts     bigint,                     -- client-reported ms timestamp (for debugging)
  answer_text   text,                       -- filled in after 10-second answer window
  matched_rank  int,                        -- which board answer it matched
  is_winner     boolean default false       -- did this buzz win the Face-Off?
);
```

### Row Level Security Policies

```sql
-- Players can read all data in their game
alter table games enable row level security;
create policy "Players can read their game"
  on games for select
  using (id in (
    select game_id from team_members where player_id = auth.uid()
  ));

-- Only the host can update game state
create policy "Host can update game"
  on games for update
  using (host_player = auth.uid());

-- Players can only insert their own answers
create policy "Players submit own answers"
  on player_answers for insert
  with check (player_id = auth.uid());

-- Everyone in the game can read all answers (for the board)
create policy "Game members read answers"
  on player_answers for select
  using (round_id in (
    select id from rounds where game_id in (
      select game_id from team_members where player_id = auth.uid()
    )
  ));
```

### Supabase Realtime Subscriptions

Every client subscribes to changes on the tables that affect their view:

```typescript
// On each player's phone and on the TV display
const gameChannel = supabase
  .channel(`game:${gameId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'games',
    filter: `id=eq.${gameId}`
  }, (payload) => {
    // Game phase changed, round advanced, etc.
    updateGameState(payload.new);
  })
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'rounds',
    filter: `game_id=eq.${gameId}`
  }, (payload) => {
    // Answer revealed, strike added, phase shifted
    updateRoundState(payload.new);
  })
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'teams',
    filter: `game_id=eq.${gameId}`
  }, (payload) => {
    // Score changed
    updateScores(payload.new);
  })
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'buzzer_events',
    filter: `round_id=eq.${currentRoundId}`
  }, (payload) => {
    // Someone buzzed in!
    handleBuzzIn(payload.new);
  })
  .subscribe();
```

### Supabase Edge Functions

Server-side logic that must not run on the client. Each Edge Function is a Deno TypeScript file deployed to Supabase's edge network.

| Edge Function | Purpose |
|---|---|
| `handle-buzz` | Receives buzz-in events, records server timestamp, determines winner if both teams have buzzed, starts the 10-second answer window |
| `judge-answer` | Runs the 3-tier answer matching pipeline (exact → alias → Gemini), writes result to `player_answers`, updates `rounds.revealed` and `teams.score` |
| `advance-round` | Handles phase transitions: face_off → playing → steal → complete, applies point multipliers, checks if game should move to next round or Fast Money |
| `start-fast-money` | Selects 5 questions, creates the `fast_money` row, manages sequester state for Player 2 |
| `tts-generate` | Calls Google Cloud TTS with the host's dialogue, returns audio URL (cached in Supabase Storage) |
| `stt-transcribe` | Receives audio blob from the player's phone, streams to Google Cloud STT, returns transcript |
| `host-dialogue` | Calls the Google ADK agent to generate the host's next line of dialogue based on game state |

---

## 3. The Three Stages — Exact Television Rules

Every rule below matches the actual Family Feud television format. No house rules, no shortcuts.

### Stage 1 — The Face-Off

**Setup:** The app picks one player from each team based on the randomized `player_order`. Round 1 uses `player_order[0]` from each team. Round 2 uses `player_order[1]`. And so on, cycling back if there are more rounds than players.

**Sequence of events:**

1. The AI host announces the two Face-Off players by name: "For this Face-Off, we have [Player A] versus [Player B]!"

2. Both players' phones show a large, pulsing **BUZZER button** and nothing else. The question is NOT shown on the phones — only on the TV. This prevents players from reading ahead before the host finishes.

3. The AI host reads the question aloud via TTS: "We surveyed 100 people. Top [N] answers are on the board. Name something you bring on a camping trip."

4. At the exact moment the host finishes reading (the TTS audio ends), the server broadcasts a `buzzer_armed` event. Both phones' buzzer buttons become active (they glow, vibrate lightly — signaling "go").

5. **The race.** Both players smash their buzzer button. Each tap sends an event to the `handle-buzz` Edge Function, which records the server-side timestamp. The first buzz to arrive wins. The server broadcasts `buzzer_winner` to all clients.

6. **The 10-second answer window.** The winning buzzer's phone immediately transforms: the buzzer disappears and a **push-to-talk microphone button** appears with a **10-second countdown** timer. The player holds the mic button and speaks their answer. If they release the button (or the 10 seconds expire), the audio is sent to `stt-transcribe` and then to `judge-answer`.

7. **The board checks.** If the answer matches any answer on the board, that tile flips (with the classic ding sound). The host announces: "[Player A] said [answer]! Let's see if it's up there... [DING] Number [rank] answer! [points] points!"

8. **The second player answers.** The losing buzzer's phone now shows the same mic button with a 10-second countdown. They give their answer. Same matching process.

9. **Control decision.** The player whose answer ranked higher (closer to #1) wins the Face-Off. If only one player's answer was on the board, they win automatically. If neither answer is on the board, the player who buzzed first gets another chance, then the other player. The winner's phone shows a "PLAY or PASS?" choice. They tap one.

**TV rules enforced:**
- If both players give the same answer, the player who buzzed first gets credit and the second must give a different answer.
- If a player doesn't answer within 10 seconds, it counts as no answer (automatic loss of the Face-Off if the other player had a valid answer).

### Stage 2 — The Main Round (Play or Pass)

**If the Face-Off winner chooses PLAY:**

Their team takes control. The team's members answer in the randomized `player_order`, starting with the person AFTER the Face-Off player in the rotation (the Face-Off player already answered).

**If the Face-Off winner chooses PASS:**

The opposing team takes control instead. Their rotation starts with `player_order[0]` (since their Face-Off representative already answered as part of the Face-Off, they move to the next person).

**Turn-by-turn play:**

1. The AI host calls the next player: "[Player name], it's your turn! Give me an answer!"

2. That player's phone lights up with the mic button and text input. Other team members' phones show "Wait — [Player Name] is answering" with the current board and score visible but no input controls.

3. The player speaks or types their answer. The `judge-answer` Edge Function processes it.

4. **Correct answer:** The tile flips on the TV with the ding. Points are added to the round's running total (NOT to the team's score yet — points are only awarded when the round ends). The host reacts. Play moves to the next player in rotation.

5. **Wrong answer:** A giant red X appears on the TV with the buzzer sound. `rounds.strikes` increments. The host reacts sympathetically. Play moves to the next player.

6. **Duplicate answer:** If the player says an answer that's already been revealed, it does NOT count as a strike. The host says "That's already up there! Try again!" and the same player gets another attempt. (This matches TV rules — duplicates are not penalized, the player just goes again.)

7. **All answers found:** If the team reveals every answer on the board before three strikes, they win all the points. The round ends.

8. **Three strikes — Steal opportunity:**

   - The controlling team is locked out. The board shows all revealed answers and the strikes.
   - The opposing team gets ONE chance to steal. The AI host turns to them: "For the steal and [X] points... can you name one of the remaining answers?"
   - The opposing team can huddle — all their phones show a **team chat** for 30 seconds where they can type suggestions to each other. Then one designated player (the team captain, or whoever is next in their rotation) submits the official steal answer via mic or text.
   - If the steal answer is correct: the opposing team gets ALL points accumulated in that round.
   - If the steal answer is wrong: the original controlling team gets all the points.

**Point multipliers (exact TV format):**

| Round | Multiplier | How it works |
|---|---|---|
| Round 1 | 1× | Points as shown on the board |
| Round 2 | 1× | Points as shown on the board |
| Round 3 | 2× | Every point value on the board is doubled |
| Round 4 | 3× | Every point value on the board is tripled |

After each round, the multiplied points are added to the winning team's `teams.score` in Supabase. The TV scoreboard updates with a counting animation.

**Deciding when to go to Fast Money:** After Round 3 (or Round 4 if configured), the game automatically transitions. The team with the higher cumulative score wins and advances to Fast Money. If scores are tied, one additional "Sudden Death" round is played at 3× points.

### Stage 3 — Fast Money

**Player selection:** The winning team picks two players from their roster. The order matters — Player 1 goes first (harder, 20 seconds), Player 2 goes second (slightly easier, 25 seconds, but must avoid duplicating Player 1's answers).

**Player 2 sequester:** When Fast Money begins, Player 2's phone immediately locks into a **sequester screen**: solid color background, animated "waiting" graphic, and music playing through the phone's speaker. The screen shows no game information. They cannot navigate away without breaking their session. Ideally, Player 2 also leaves the room or puts on headphones so they can't hear Player 1's answers being read aloud on the TV.

**Player 1's round (20 seconds):**

1. The TV shows five empty answer rows. A 20-second timer is prominent.
2. The AI host says: "Alright [Player 1], you need 200 points to win it all. I'm going to ask you five questions. Say the first thing that comes to mind. Here we go!"
3. The host reads Question 1 via TTS. Player 1's phone shows the mic button.
4. The player speaks their answer. It locks in immediately (displayed on the TV as "[LOCKED]" — the point value is hidden during this phase).
5. If the player hesitates too long (5+ seconds of silence after the question), the host prompts: "I need an answer!" If 8 seconds pass with no answer, it's recorded as "No Answer" (0 points) and the next question fires.
6. Immediately after the answer locks, the host reads Question 2. This continues for all 5 questions.
7. If the 20-second master timer expires mid-question, remaining questions are all scored as 0 points.

**Player 2's round (25 seconds):**

1. Player 2's sequester screen clears. The host says: "[Player 2], come on up! Same five questions. 25 seconds. If you give the same answer as [Player 1], I'll ask you to try again. Let's go!"
2. Same rapid-fire process, but with one critical rule: if Player 2's answer matches Player 1's answer for the same question (checked by the `judge-answer` function against Player 1's recorded answers), the AI host immediately says "Try again!" and Player 2 must give a different answer. The clock does NOT pause during this exchange.

**The Grand Reveal:**

This is the emotional climax. Both players stand together (in the room) facing the TV.

1. The TV shows a two-column layout: Player 1's answers on the left, Player 2's answers on the right. All point values are hidden.
2. The AI host reveals one question at a time, top to bottom:
   - "We asked: [Question 1]. [Player 1], you said [answer]... Survey says..."
   - *Dramatic 2-second pause (SSML `<break>`).*
   - The point value appears next to the answer. The running total at the bottom updates.
   - "[Player 2], you said [answer]... Survey says..."
   - Same reveal. Running total updates again.
3. If at any point during the reveal the running total hits or exceeds **200 points**, the host goes wild: "THAT'S 200! YOU'VE WON! CONGRATULATIONS!" Confetti, victory music, celebration animation.
4. If after all 10 answers (5 per player) the total is under 200, the host consoles: "You played a great game! You finished with [total] points!"

---

## 4. System Architecture (Revised with Supabase)

```
┌──────────────────────────────────────────────────────────────┐
│                   PLAYER PHONES (React PWA)                  │
│                                                              │
│  ├── Login (username + room code → Supabase Anonymous Auth)  │
│  ├── Buzzer Button (sends event to Edge Function)            │
│  ├── Push-to-Talk Mic (MediaRecorder → Edge Function)        │
│  ├── Text Input Fallback                                     │
│  ├── Team Chat (during steal huddle)                         │
│  ├── Sequester Screen (Fast Money Player 2)                  │
│  └── Supabase Realtime subscription (game state updates)     │
└──────────────────────────┬───────────────────────────────────┘
                           │ HTTPS + WebSocket
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                       SUPABASE                               │
│                                                              │
│  ├── Auth (anonymous sessions, session persistence)          │
│  ├── Postgres Database (all tables above)                    │
│  ├── Realtime (broadcast game state to all devices)          │
│  ├── Edge Functions:                                         │
│  │   ├── handle-buzz (arbitrate Face-Off races)              │
│  │   ├── judge-answer (3-tier matching pipeline)             │
│  │   ├── advance-round (game state machine transitions)      │
│  │   ├── stt-transcribe (proxy to Google Cloud STT)          │
│  │   ├── tts-generate (proxy to Google Cloud TTS)            │
│  │   ├── host-dialogue (call Google ADK agent)               │
│  │   └── start-fast-money (setup + sequester management)     │
│  └── Storage (cached TTS audio files, question assets)       │
└───────┬──────────┬──────────┬────────────────────────────────┘
        │          │          │
   ┌────▼───┐ ┌───▼────┐ ┌──▼─────────┐
   │ Google │ │ Google │ │ Google     │
   │ Cloud  │ │ Cloud  │ │ Gemini API │
   │ STT    │ │ TTS    │ │ + ADK      │
   └────────┘ └────────┘ └────────────┘

┌──────────────────────────────────────────────────────────────┐
│                   TV DISPLAY (React PWA)                     │
│                                                              │
│  ├── Game Board (flip tiles, strikes, scores)                │
│  ├── Lobby (room code, QR code, player list)                 │
│  ├── Fast Money Board (dual-column reveal)                   │
│  ├── Audio playback (AI host voice via Web Audio API)        │
│  └── Supabase Realtime subscription (same channel as phones) │
└──────────────────────────────────────────────────────────────┘
```

### Key Architecture Decisions

**Supabase Edge Functions as the game server.** Rather than running a persistent Node.js server on Cloud Run, we use Supabase Edge Functions for all server-side logic. Each game action (buzz, answer, advance) is a stateless function call. The game state lives entirely in Postgres. This means zero server management, automatic scaling, and no idle costs. Edge Functions are invoked via HTTPS from the client, with Supabase Auth JWT tokens for authentication.

**Supabase Realtime as the synchronization layer.** Every write to the Postgres tables triggers a Realtime broadcast. All connected clients (phones and TV) receive updates within 50-100ms. This replaces the need for a custom WebSocket server. The subscription model is inherently multiplayer — you don't manage connections, rooms, or broadcasts yourself.

**Google Cloud services called FROM Edge Functions, not from the client.** The player's phone never talks directly to Google Cloud. Audio goes phone → Edge Function → Cloud STT. Host dialogue goes Edge Function → ADK → Edge Function → Cloud TTS → cached audio URL → phone. This keeps API keys server-side, enforces rate limits, and lets us cache TTS audio in Supabase Storage.

---

## 5. The AI Host — Personality and Implementation

The AI host is the centerpiece of the experience. It replaces the human host entirely, reading questions, accepting answers, reacting to gameplay, and driving the energy of the room.

### Host Agent Design (Google ADK)

The Google ADK lets us define the host as an **agent** with a system prompt (personality), a set of **tools** (game actions it can invoke), and **memory** (conversation history within the game session).

**Agent personality prompt:**

> You are the host of Family Feud. You are enthusiastic, quick-witted, and love dramatic pauses. You call players by their actual usernames. You react with excitement to correct answers ("Good answer! Good answer!"), sympathy to strikes ("Ohhh, that's a strike!"), and build suspense during reveals. You keep the game moving briskly. You occasionally crack family-friendly jokes. You reference what happened earlier in the game ("Your brother said the same thing last round!"). You never break character. You follow television Family Feud pacing — fast during regular play, slow and dramatic during reveals.

**Agent tools the host can call:**

| Tool | What it does |
|---|---|
| `read_question(round_id)` | Fetches the next question from Supabase and reads it via TTS |
| `judge_answer(player_answer, question_id)` | Sends the answer to the matching pipeline, returns match result |
| `reveal_answer(round_id, rank)` | Updates `rounds.revealed` in Supabase, triggering tile flip on all clients |
| `add_strike(round_id)` | Increments `rounds.strikes`, triggers X animation and buzzer |
| `update_score(team_id, points)` | Updates `teams.score` in Supabase |
| `start_timer(seconds, context)` | Broadcasts a countdown timer to all clients |
| `play_sound(effect)` | Triggers sound effects — ding, buzzer, theme, applause, sad trombone |
| `advance_phase(round_id, next_phase)` | Moves the game state machine forward |
| `get_game_state(game_id)` | Reads current game context for informed commentary |
| `get_player_history(game_id)` | Fetches previous answers for callbacks and banter |

### Voice Input Flow (Push-to-Talk with 10-Second Window)

1. The game server (Edge Function) determines it's a player's turn and broadcasts `your_turn` to that player's phone
2. The player's phone displays a large microphone button with a **10-second countdown** bar at the top
3. The player **presses and holds** the mic button. The browser's `MediaRecorder` API begins capturing audio as WebM/Opus
4. The player speaks their answer and **releases** the button (or the 10-second timer expires, auto-releasing)
5. The captured audio blob is POST'd to the `stt-transcribe` Edge Function
6. The Edge Function streams the audio to Google Cloud Speech-to-Text (streaming recognition, `latest_long` model)
7. The transcript is returned to the client AND passed to `judge-answer`
8. The AI host responds via TTS: either confirming the answer ("You said 'camping stove!' Let's see...") or handling a miss
9. If a player has NOT pressed the mic button at all after 10 seconds, it counts as "no answer"

**Text input fallback:** Below the mic button, a text field is always visible. The player can type their answer and tap Submit instead of speaking. This bypasses STT entirely — the typed text goes straight to `judge-answer`. The AI host still responds vocally to typed answers.

### Pre-Cached Host Audio

Common phrases are pre-generated via Cloud TTS at app startup and cached in Supabase Storage. This eliminates latency for the most frequent host lines:

- "Good answer! Good answer!"
- "Show me [answer]!" (with the top 100 most common answers pre-generated)
- "Strike!" / "Strike two!" / "Strike three!"
- "Survey says..."
- "That's already up there! Try again!"
- "I need an answer!"
- "Try again!" (for Fast Money duplicate)
- "Let's play the Feud!"
- Round transition phrases

Dynamic lines (player names, score announcements, contextual banter) are generated in real-time via TTS, but the base latency for common phrases is near zero since the audio is already in storage.

---

## 6. Answer Matching Engine — The Three-Tier Pipeline

Every player answer passes through a three-tier matching system, executed inside the `judge-answer` Edge Function.

### Tier 1 — Exact and Normalized String Match

Strip punctuation, lowercase everything, remove articles ("a", "an", "the"), apply basic stemming (plural → singular). "The Beach" and "beach" and "beaches" all match "Beach." Check against both the canonical `answers.text` and all entries in `answers.aliases`. This catches roughly 60% of answers with zero external API calls and sub-10ms latency.

### Tier 2 — Extended Alias Lookup with Phonetic Matching

Each answer row stores an `aliases` array populated with known synonyms, abbreviations, and common phrasings. Additionally, we apply Soundex/Metaphone phonetic matching to catch misspellings and STT transcription errors ("beech" matching "beach", "sunglass" matching "sunglasses"). This catches another 25% of answers.

### Tier 3 — Gemini Semantic Judgment

For the remaining ~15% of ambiguous answers, we call Gemini Flash with a structured prompt:

> **System:** You are a Family Feud answer judge. Given a survey question, the list of correct board answers, and a player's spoken answer, determine if the player's answer matches any board answer. Respond with ONLY the exact text of the matching board answer, or "NO MATCH" if there is no match. Be generous — Family Feud accepts reasonable interpretations. "SPF stuff" matches "Sunscreen." "Jalopy" matches "Car." But don't stretch — "Ocean" does not match "Swimming Pool."
>
> **User:** Question: "Name something you bring on a camping trip." Board answers: [Tent, Food, Sleeping Bag, Flashlight, Bug Spray, Matches, Cooler]. Player said: "a place to sleep in." Your judgment?
>
> **Response:** Sleeping Bag

**Gemini model:** `gemini-2.0-flash` at temperature 0.0 for deterministic, consistent judgments.

### Host Override

The game organizer (host player) has a subtle **override panel** on their phone. After any answer judgment, two small buttons appear: **Force Accept** and **Force Reject**. If the AI was wrong — either too lenient or too strict — the host taps the override. This triggers an immediate correction: the board flips (or un-flips), scores adjust, and the AI host says "Let me take another look at that... [corrected ruling]!"

---

## 7. Question and Answer Sourcing Strategy

### Source 1 — Historical Family Feud Archives

Fan-maintained databases catalog thousands of questions and answers from decades of aired episodes. Survey results are factual data and are not copyrightable as game mechanics. Key sources include fan wikis and episode transcription archives, video game data mines from the licensed Ubisoft/Ludia Family Feud games, and community-curated spreadsheets on Reddit and board game forums. We scrape, deduplicate, clean, and normalize this data into the Postgres `questions` and `answers` tables with full alias lists.

### Source 2 — AI-Generated Questions with Simulated Survey Data

For fresh questions, we use Gemini 2.5 Pro to generate new questions and simulate realistic survey distributions:

> Generate a Family Feud survey question about [category]. Then list 6-8 answers that 100 surveyed Americans might give, with realistic point distributions summing to 100. The #1 answer should have 25-45 points. Include both obvious and surprising answers.

We validate by running the same question through a second Gemini call acting as an independent "survey panel." Questions with inconsistent rankings across runs are discarded. Validated questions are inserted into Supabase with `source = 'generated'`.

### Source 3 — Custom Family Questions

The app includes a **Question Creator** accessible from the host's phone during lobby setup. The host types a question, enters 4-8 answers with point values, and saves. These are stored with `source = 'custom'` and only appear in that family's games. Examples: "Name something Dad always burns on the grill," "Name a place Mom hides birthday presents."

### Data Volume

The database should stock **500+ questions** at launch (enough for 50+ unique game nights). A weekly batch job uses Gemini Pro to generate and validate 20 new questions, automatically inserted into Supabase.

---

## 8. The Complete Player Experience — A Saturday Night Walkthrough

### Pre-Game (5 minutes)

1. **You** open `familyfeud.app` on your laptop. You click "Host New Game." The TV shows a big room code **FEUD** and a QR code.

2. **Mom** scans the QR code with her iPhone camera. Safari opens. She types "Mom" as her username, enters "FEUD", and taps Join. Her name appears on the TV instantly.

3. **Dad, your sister, her husband, your brother, Grandma, and the two cousins** all do the same thing on their phones. Nine players connected in about 90 seconds.

4. **You** drag names into teams on the TV. Team 1: You, Mom, Brother, Cousin A. Team 2: Dad, Sister, Her Husband, Grandma, Cousin B. You name the teams "The Originals" vs "The In-Laws." You tap "Randomize Order" — the app shuffles each team's play order and displays it.

5. **You** pick the AI host voice (you choose the warm baritone), set 4 rounds, and toggle on custom questions. You tap "Start Game."

6. **The TV speakers boom:** "Welcome to FAMILY FEUD! Tonight we have The Originals taking on The In-Laws! Let's meet the families!"

### Round 1 Face-Off (2 minutes)

7. The randomized order picked **You** (Originals) vs **Dad** (In-Laws) for the first Face-Off. The host announces you both by name.

8. Your phones both show a huge pulsing buzzer. The TV shows the question text as the host reads: "We surveyed 100 people. Top 7 answers on the board. Name something people forget to pack for vacation."

9. The moment the host's voice stops, your buzzers activate. Dad smashes his 200ms before you. His phone instantly switches to a mic button with a 10-second timer counting down. He holds it and says "Toothbrush!" — releases. The STT picks it up, the board checks — #1 answer, 35 points. The tile flips with a ding. The host goes wild.

10. Your phone now shows the mic button with 10 seconds. You say "Phone charger." #3 answer, 15 points. Tile flips.

11. Dad's answer ranked higher. His phone shows "PLAY or PASS?" He taps PLAY. The In-Laws are up.

### Round 1 Main Round (5 minutes)

12. The In-Laws answer in their shuffled order: Sister → Husband → Grandma → Cousin B → Dad (cycling). Sister's up first. Her phone lights up. She says "Underwear." #2 answer, 28 points. Ding!

13. Husband says "Sunscreen." #4 answer, 10 points. Ding!

14. Grandma says "Pajamas." Not on the board. STRIKE ONE. A huge red X slams onto the TV. The host: "Ohhh, sorry Grandma!"

15. Cousin B says "Snacks." Not on the board. STRIKE TWO.

16. Dad says "Medicine." #6 answer, 3 points. Ding! Relief.

17. Sister again: "Socks." Not on the board. STRIKE THREE. Triple buzzer. The In-Laws are locked out.

18. **Steal opportunity.** The Originals' phones all show a team chat. You type "CHARGER IS ALREADY UP. Say 'toiletries'??" Mom types "Deodorant!" Brother types "IDK." You have 30 seconds to huddle. Mom is designated stealer. She holds the mic: "Toiletries!" — the board checks. #5 answer, 7 points. STEAL SUCCESSFUL. The Originals get all 98 accumulated points.

19. Scoreboard: Originals 98, In-Laws 0. The host: "The Originals take the lead with a big steal!"

### Rounds 2-4 (15 minutes)

20. Play continues. New Face-Offs with the next players in rotation. Rounds 3 and 4 are worth double and triple points, making the scores swing dramatically. By the end of Round 4, it's Originals 312, In-Laws 287. Tight game.

### Fast Money (5 minutes)

21. The Originals won. You and Mom are selected for Fast Money. Mom is Player 2. Her phone immediately locks into the sequester screen — purple background, swirling animation, smooth jazz playing. She puts in earbuds and walks to the kitchen.

22. You sit in front of the TV. Five empty rows. 20-second timer. The host: "You need 200 points. First thing that comes to mind. Ready? GO!"

23. "Name a color people paint their bedroom." You: "Blue!" LOCKED. "Name something you'd find in a gym bag." You: "Shoes!" LOCKED. "Name an animal at the zoo kids love." You: "Monkey!" LOCKED. "Name a reason people call in sick." You: "Cold!" LOCKED. "Name something you buy at a gas station." You: "Snacks!" LOCKED. All five answered with 4 seconds to spare.

24. Mom comes back. Her sequester screen clears. 25 seconds. Same five questions. She says "Blue!" for the bedroom color — host: "Try again!" She pivots: "Gray!" LOCKED. She blazes through the rest.

25. **The Grand Reveal.** The host slows way down. "For 'Name a color people paint their bedroom,' [You] said 'Blue'... survey says..." Two-second pause. "FORTY-ONE POINTS!" The family erupts. Running total: 41. "[Mom] said 'Gray'... survey says... eight points." Total: 49. And so on, question by question, the tension building. The total creeps up: 49... 88... 131... 168... 

26. "Last question. 'Name something you buy at a gas station.' [You] said 'Snacks.' Survey says..." The room goes silent. "THIRTY-TWO POINTS!" Total: 200. "THAT'S 200!!! YOU WON!!!" Confetti explodes across the TV. Victory music blasts. The family jumps up and down.

---

## 9. Google Cloud Services — Detailed Integration

### Google Cloud Speech-to-Text (STT)

**SDK:** `@google-cloud/speech` (called from Supabase Edge Functions)

**Configuration:** Model `latest_long` for conversational speech. Language `en-US` (configurable). Single utterance mode enabled (one answer per mic press). Audio encoding `WEBM_OPUS` (native browser format). Automatic punctuation enabled.

**10-second window integration:** The Edge Function opens a streaming recognition session when the player's turn begins. Audio chunks flow in as the player speaks. When the player releases the mic OR the 10-second timer expires, the function sends a half-close signal and receives the final transcript within ~200ms.

**Cost:** ~$0.006 per 15 seconds. A full game uses ~3 minutes of audio total = $0.07.

### Google Cloud Text-to-Speech (TTS)

**SDK:** `@google-cloud/text-to-speech` (called from Edge Functions)

**Voice options:** `en-US-Neural2-D` (warm male, default), `en-US-Neural2-F` (energetic female), `en-US-Neural2-A` (calm male), `en-US-Neural2-C` (bright female). Host selection during lobby setup.

**SSML for drama:**
```xml
<speak>
  Survey says...
  <break time="2000ms"/>
  <emphasis level="strong">Forty-one points!</emphasis>
  <break time="500ms"/>
  That's our number one answer!
</speak>
```

**Cost:** ~$16 per million characters. A game uses ~3,000 characters = $0.05.

### Gemini API (via Vertex AI)

**Answer judging:** `gemini-2.0-flash`, temperature 0.0, ~10 calls per game at ~200 tokens each. Cost: negligible.

**Host dialogue:** `gemini-2.0-flash`, temperature 0.8, ~40 calls per game at ~300 tokens each. Cost: ~$0.002.

**Question generation (offline batch):** `gemini-2.5-pro`, ~100 calls per weekly batch. Cost: ~$0.50/week.

### Google Agent Development Kit (ADK)

**SDK:** `@google/adk`

The ADK agent is instantiated inside the `host-dialogue` Edge Function. Each game action (player answers, round advances, score updates) triggers an agent invocation with the current game state as context. The agent decides what to say next and which tools to invoke, then returns the dialogue text which is sent to TTS.

**Agent state management:** Since Edge Functions are stateless, the agent's conversation history is stored in a Supabase `host_memory` table and loaded into each invocation. This lets the host remember what happened earlier in the game for callbacks and banter.

---

## 10. Per-Game Cost Analysis (Revised with Supabase)

| Service | Usage per Game | Cost |
|---|---|---|
| Google Cloud STT | ~3 min audio | $0.07 |
| Google Cloud TTS | ~3,000 chars | $0.05 |
| Gemini Flash | ~20K tokens | $0.002 |
| Supabase Database | ~600 reads, 150 writes | Free tier covers it |
| Supabase Edge Functions | ~100 invocations | Free tier covers it |
| Supabase Realtime | ~30 min session, 10 clients | Free tier covers it |
| Supabase Auth | ~10 anonymous sessions | Free tier covers it |
| **Total** | | **~$0.12 per game** |

Supabase's free tier includes 50,000 monthly active users, 500 MB database, 5 GB bandwidth, and 500,000 Edge Function invocations. For a family game night, you'll never come close to these limits. The only real cost is Google Cloud API usage at roughly 12 cents per game.

---

## 11. Development Roadmap

### Phase 1 — Supabase Foundation + Core UI (Weeks 1-2)

- Supabase project setup (Auth, Database, Realtime, Edge Functions)
- All database tables, RLS policies, and indexes created
- React PWA scaffolding with responsive phone and TV layouts
- Anonymous auth login flow with username and room code
- Lobby: player join, team assignment, randomized order
- Supabase Realtime subscriptions working across devices

### Phase 2 — Face-Off + Main Round with Text Input (Weeks 3-4)

- Face-Off buzzer with server-side arbitration (10-second answer window)
- Answer board UI with flip tile animations and strike markers
- `judge-answer` Edge Function with Tier 1 and Tier 2 matching
- Turn rotation based on randomized `player_order`
- Steal flow with team chat huddle
- Point multipliers for later rounds
- 100 curated questions loaded into Supabase

### Phase 3 — AI Voice Integration (Weeks 5-6)

- `stt-transcribe` Edge Function (Google Cloud STT)
- `tts-generate` Edge Function (Google Cloud TTS)
- Push-to-talk mic button on phone UI
- Pre-cached common host phrases in Supabase Storage
- Sound effects library (dings, buzzers, applause, theme music)
- AI host reads questions and reacts to answers

### Phase 4 — ADK Agent Host (Weeks 7-8)

- Google ADK agent setup with personality and tools
- `host-dialogue` Edge Function
- Dynamic commentary based on game state
- Host memory persistence across the game session
- Host voice selection during lobby setup

### Phase 5 — Fast Money (Weeks 9-10)

- Player sequester screen with music and lock
- 20-second / 25-second timer with strict enforcement
- Duplicate answer detection against Player 1's responses
- Grand Reveal animation with dramatic pacing
- 200-point threshold celebration

### Phase 6 — Content Pipeline + Polish (Weeks 11-12)

- Gemini Pro question generation batch pipeline
- Custom question creator in the app
- 500+ question database
- Post-game summary screen (scores, highlights, MVP)
- Performance optimization (audio latency, Realtime reliability)
- Family beta testing across 3-5 game nights
- Production deployment

---

## 12. Key Technical Risks and Mitigations

**Risk: Buzz-in race is unfair due to network latency differences.**
Mitigation: The server records server-side timestamps, not client-side. All players connect to the same Supabase region, so latency differences between phones on the same Wi-Fi network are typically <10ms. For true fairness, we can implement a "ready" handshake — the server only arms buzzers after confirming all clients have received the question audio.

**Risk: Speech recognition struggles with accents, kids' voices, or loud rooms.**
Mitigation: Push-to-talk isolates audio to one player at a time. Text input is always available. We can offer a "kids mode" that uses a more lenient STT model. The host override button lets the organizer correct mistakes.

**Risk: 10-second answer window is too short / too long.**
Mitigation: On the TV show, players typically answer within 3-5 seconds. 10 seconds is generous. However, the game settings (configurable during lobby) include an "answer window" slider: 8, 10, 15, or 20 seconds — so families with younger kids or non-native English speakers can adjust.

**Risk: Supabase Realtime drops connection during the game.**
Mitigation: The Supabase client library auto-reconnects. On reconnect, the client fetches the full current game state via a REST query to re-sync. We also implement heartbeat checks — if a phone hasn't received a Realtime event in 10 seconds, it polls via REST as a fallback.

**Risk: Edge Function cold starts add latency.**
Mitigation: Supabase Edge Functions have minimal cold start times (~50-100ms). For the most latency-sensitive functions (`handle-buzz`, `stt-transcribe`), we keep them warm by pinging them during the game lobby setup. Pre-cached TTS audio eliminates the most common latency bottleneck.

---

## Appendix A — Project Setup Checklist

### Supabase

1. Create a new Supabase project at `supabase.com`
2. Run all `CREATE TABLE` statements from Section 2
3. Apply all RLS policies
4. Enable Realtime on tables: `games`, `rounds`, `teams`, `buzzer_events`, `player_answers`, `fast_money`
5. Deploy Edge Functions: `handle-buzz`, `judge-answer`, `advance-round`, `stt-transcribe`, `tts-generate`, `host-dialogue`, `start-fast-money`
6. Configure environment variables in Edge Functions: `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_CLOUD_CREDENTIALS`, `GEMINI_API_KEY`
7. Create Storage bucket `tts-cache` for pre-generated host audio

### Google Cloud

1. Create a new GCP project
2. Enable APIs: Speech-to-Text, Text-to-Speech, Vertex AI
3. Create a service account with roles: `roles/speech.client`, `roles/texttospeech.client`, `roles/aiplatform.user`
4. Export service account JSON key, store as Supabase Edge Function secret
5. Install ADK: `npm install @google/adk`

### Frontend

1. Scaffold Next.js app with TypeScript
2. Install `@supabase/supabase-js`
3. Configure Supabase client with project URL and anon key
4. Build responsive layouts: phone controller view + TV display view
5. Implement PWA manifest for "Add to Home Screen" capability on phones
6. Deploy to Vercel, Netlify, or Supabase's built-in hosting

---

## Appendix B — Supabase Edge Function Examples

### handle-buzz (simplified)

```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { round_id, player_id, team_id, client_ts } = await req.json();
  
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const server_ts = new Date().toISOString();

  // Check if someone already buzzed for this round
  const { data: existing } = await supabase
    .from("buzzer_events")
    .select("*")
    .eq("round_id", round_id)
    .eq("is_winner", true)
    .single();

  if (existing) {
    // A winner already exists — this player buzzed second
    await supabase.from("buzzer_events").insert({
      round_id, player_id, team_id,
      buzzed_at: server_ts, client_ts,
      is_winner: false
    });
    return new Response(JSON.stringify({
      status: "second",
      winner: existing.player_id
    }));
  }

  // This player buzzed first — they win
  await supabase.from("buzzer_events").insert({
    round_id, player_id, team_id,
    buzzed_at: server_ts, client_ts,
    is_winner: true
  });

  return new Response(JSON.stringify({
    status: "winner",
    answer_window_seconds: 10
  }));
});
```

### judge-answer (simplified)

```typescript
serve(async (req) => {
  const { round_id, question_id, player_id, raw_text } = await req.json();
  
  // Fetch all answers for this question
  const { data: answers } = await supabase
    .from("answers")
    .select("*")
    .eq("question_id", question_id)
    .order("rank");

  // Fetch already-revealed answers for this round
  const { data: round } = await supabase
    .from("rounds")
    .select("revealed")
    .eq("id", round_id)
    .single();

  const normalized = normalize(raw_text); // lowercase, strip articles, stem

  // TIER 1: Exact match against canonical text and aliases
  for (const answer of answers) {
    if (round.revealed.includes(answer.rank)) continue; // already on board
    const candidates = [answer.text, ...answer.aliases].map(normalize);
    if (candidates.includes(normalized)) {
      return matchFound(answer, round_id, player_id, raw_text);
    }
  }

  // TIER 2: Phonetic matching (Soundex / Metaphone)
  for (const answer of answers) {
    if (round.revealed.includes(answer.rank)) continue;
    const candidates = [answer.text, ...answer.aliases];
    if (candidates.some(c => soundex(c) === soundex(raw_text))) {
      return matchFound(answer, round_id, player_id, raw_text);
    }
  }

  // TIER 3: Gemini semantic judgment
  const geminiResult = await callGeminiJudge(question_id, answers, raw_text);
  if (geminiResult !== "NO MATCH") {
    const matched = answers.find(a => a.text === geminiResult);
    if (matched && !round.revealed.includes(matched.rank)) {
      return matchFound(matched, round_id, player_id, raw_text);
    }
  }

  // No match — it's a strike
  return strikeResult(round_id, player_id, raw_text);
});
```

---

## Appendix C — Phone UI State Machine

Each player's phone displays different UI based on the game state and whether it's their turn. The phone app is a single React component tree driven by the game state from Supabase Realtime.

```
LOBBY
  └── Username input + room code → Join button

TEAM_SETUP
  └── "You're on [Team Name]!" + team roster display

FACE_OFF_WAITING
  └── "Watch the board! Face-Off between [A] and [B]"

FACE_OFF_BUZZER (only for the two Face-Off players)
  └── Giant pulsing buzzer button → tap to buzz

FACE_OFF_ANSWER (only for the buzzer winner, then the loser)
  └── Mic button + text input + 10-second countdown

PLAY_OR_PASS (only for Face-Off winner)
  └── Two big buttons: "PLAY" / "PASS"

YOUR_TURN
  └── Mic button + text input + 10-second countdown + question text

WAITING_FOR_TEAMMATE
  └── "It's [Name]'s turn" + current board state + score

STEAL_HUDDLE (only for stealing team)
  └── Team chat + "Submit Steal Answer" button (for designated player)

FAST_MONEY_SEQUESTER (Player 2 only)
  └── Locked screen + music + "Waiting for [Player 1]"

FAST_MONEY_ACTIVE (Player 1 or Player 2 when it's their turn)
  └── Mic button + countdown timer (20s or 25s)

FAST_MONEY_REVEAL
  └── Watch the TV — answers and points revealed one by one

GAME_OVER
  └── Final scores + highlights + "Play Again?" button
```

---

*This is a living document. The most important milestone is getting the Face-Off → Main Round loop playable with text input by the end of Week 4. Once you can play a full round with your family — even without the AI voice — you'll get invaluable feedback on pacing, UI clarity, and rule edge cases that no amount of planning can predict. Voice and ADK polish come after the core game is fun.*