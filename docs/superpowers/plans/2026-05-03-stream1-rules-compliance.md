# Stream 1: Rules Compliance Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 12 rule discrepancies so the game plays exactly like the TV show — correct face-off mechanics, proper scoring, host as TV-only.

**Architecture:** Modify API routes (handle-buzz, judge-answer, advance-round), the host page, PhoneController state machine, DB schema (add face-off tracking columns), and Scoreboard display. Each fix is independent and can be tested individually.

**Tech Stack:** Next.js API routes, Supabase Postgres, TypeScript, Zustand

---

### Task 1: Host is TV-Only (Remove Player Creation)

**Files:**
- Modify: `src/app/host/page.tsx:27-89`
- Modify: `src/components/lobby/Lobby.tsx`

- [ ] **Step 1: Remove player creation from host page**

Replace the `initGame` function in `src/app/host/page.tsx`. Remove all player creation logic (lines 40-61). The host only creates a game — no player record, no team membership. Store only `gameId` in sessionStorage.

```typescript
// In initGame(), replace lines 40-80 with:
// Sign in anonymously (needed for Supabase auth on game creation)
let { data: { session } } = await supabase.auth.getSession();
if (!session) {
  await signInAnonymously();
  const res = await supabase.auth.getSession();
  session = res.data.session;
}

// Create game directly — host is the auth user, NOT a player
const code = generateRoomCode();
const { data: newGame, error } = await supabase
  .from('games')
  .insert({
    room_code: code,
    host_player: session!.user.id, // Use auth ID, not a player ID
    status: 'lobby',
    current_round: 0,
    settings: {
      total_rounds: 4,
      host_voice: 'en-US-Neural2-D',
      include_custom_questions: true,
      answer_window_seconds: 10,
    },
  })
  .select();

if (error || !newGame?.length) throw error || new Error('Failed to create game');
setGameId(newGame[0].id);
setRoomCode(newGame[0].room_code);
sessionStorage.setItem('gameId', newGame[0].id);
```

Remove `setHostId`, `hostId` state, and the `playerId` sessionStorage. Remove unused imports (`getAvatarColor`, `createPlayer`).

- [ ] **Step 2: Update Lobby to not show host in player list**

The Lobby already filters by `game_id` — since the host no longer creates a player record, it won't appear. Verify the `PlayerList` `hostId` prop is no longer needed or pass `null`.

- [ ] **Step 3: Update games table to use auth_id for host_player**

```sql
-- Run in Supabase SQL editor:
-- host_player now stores auth.uid() instead of player.id
-- No schema change needed — it's already a uuid column
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "fix: host is TV-only, no player record created"
```

---

### Task 2: Fix Face-Off Mechanics (Both Players Answer, Winner = Higher Rank)

**Files:**
- Modify: `src/app/api/handle-buzz/route.ts` (full rewrite)
- Modify: `src/app/api/judge-answer/route.ts` (add face-off comparison)
- Modify: `src/components/phone/PhoneController.tsx:67-86` (both players get answer screen)
- Add column: `face_off_buzzer_order` to rounds table

- [ ] **Step 1: Add face-off tracking columns to DB**

```sql
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS face_off_answer1_rank int;
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS face_off_answer1_player uuid;
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS face_off_answer2_rank int;
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS face_off_answer2_player uuid;
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS face_off_pair_index int DEFAULT 0;
```

- [ ] **Step 2: Update types**

Add to `Round` interface in `src/types/game.ts`:
```typescript
face_off_answer1_rank: number | null;
face_off_answer1_player: string | null;
face_off_answer2_rank: number | null;
face_off_answer2_player: string | null;
face_off_pair_index: number;
```

Add same fields to `src/lib/supabase/types.ts` rounds Row/Insert/Update.

- [ ] **Step 3: Rewrite handle-buzz to only record buzz order**

The buzzer should NOT set `face_off_winner`. It only records who buzzed first (determines answer order). Both players still need to answer.

```typescript
// handle-buzz/route.ts — new logic:
// 1. Check if someone already buzzed for this round
// 2. If no buzz yet: record as first_buzzer, return { status: 'first', answer_order: 1 }
// 3. If first buzz exists: record as second, return { status: 'second', answer_order: 2 }
// 4. Both players then transition to answer screen
// 5. Do NOT set face_off_winner here
```

- [ ] **Step 4: Add face-off answer comparison to judge-answer**

When `phase === 'face_off'`, after judging the answer:
- Store the result in `face_off_answer1_rank` or `face_off_answer2_rank` on the round
- If both face-off answers are now recorded, compare ranks:
  - Lower rank number = higher on board = winner
  - If only one is on the board, that player wins
  - If neither is on the board, increment `face_off_pair_index` and return `{ face_off_result: 'neither' }`
- Set `face_off_winner` only after comparison
- Return `{ face_off_result: 'winner' | 'loser' | 'neither', face_off_winner_id }`

- [ ] **Step 5: Update PhoneController for face-off**

Both face-off players should see the buzzer, then BOTH see the answer screen (first buzzer answers first, second buzzer answers second). Update the state logic:

```typescript
// In phoneState memo, face_off phase:
if (isFaceOffPlayer) {
  if (!currentRound.face_off_winner) {
    // No winner determined yet
    const hasBuzzed = buzzerEvents.some(e => e.player_id === playerId);
    if (!hasBuzzed) return 'face_off_buzzer';
    // Buzzed but waiting for both answers
    const myAnswer = currentRound[`face_off_answer${myOrder}_rank`];
    if (myAnswer === null || myAnswer === undefined) return 'face_off_answer';
    return 'face_off_waiting'; // Answered, waiting for other player
  }
  if (currentRound.face_off_winner === playerId) return 'play_or_pass';
  return 'waiting_for_teammate';
}
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "fix: face-off winner determined by answer rank, not buzz speed"
```

---

### Task 3: Duplicates Count as Strikes

**Files:**
- Modify: `src/app/api/judge-answer/route.ts:152-159`

- [ ] **Step 1: Add strike increment to duplicate branch**

In `judge-answer/route.ts`, the duplicate detection block (around line 152-159) currently returns early without incrementing strikes. Fix:

```typescript
// When duplicate detected (answer rank already in revealed):
// 1. Insert player_answers record with is_correct: false
await supabase.from('player_answers').insert({
  round_id, player_id, team_id, raw_text,
  matched_rank: matchedAnswer.rank,
  is_correct: false, phase,
});

// 2. Increment strikes (same as wrong answer)
if (round_id) {
  const { data: roundData } = await supabase
    .from('rounds').select('strikes').eq('id', round_id).limit(1);
  const currentStrikes = roundData?.[0]?.strikes ?? 0;
  await supabase.from('rounds')
    .update({ strikes: currentStrikes + 1 }).eq('id', round_id);
}

// 3. Return with is_duplicate flag
return NextResponse.json({
  is_correct: false, is_duplicate: true,
  message: 'Already on the board — counts as a strike!',
});
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "fix: duplicate answers now count as strikes per TV rules"
```

---

### Task 4: 300-Point Win Threshold + Sudden Death

**Files:**
- Modify: `src/app/api/advance-round/route.ts` (complete_round action)

- [ ] **Step 1: Add 300-point check after awarding points**

In the `complete_round` action, after awarding points to the team, check if either team has reached 300:

```typescript
// After awarding points, fetch both teams' scores
const { data: allTeams } = await supabase
  .from('teams').select('id, score').eq('game_id', round.game_id);

const maxScore = Math.max(...(allTeams || []).map(t => t.score));
const winningTeam = allTeams?.find(t => t.score === maxScore);

// Check 300-point threshold
if (maxScore >= 300) {
  await supabase.from('games')
    .update({ status: 'fast_money' }).eq('id', round.game_id);
  await supabase.from('rounds')
    .update({ phase: 'complete' }).eq('id', round_id);
  return NextResponse.json({
    status: 'game_won', winner_team: winningTeam?.id,
    points_awarded: totalPoints, final_scores: allTeams,
  });
}
```

- [ ] **Step 2: Add sudden death when tied after final round**

```typescript
// After round 4 (or total_rounds), if no team has 300:
if (round.round_number >= totalRounds) {
  const scores = (allTeams || []).map(t => t.score);
  if (scores[0] === scores[1]) {
    // SUDDEN DEATH — create triple-value round
    // ... select new question, create round with multiplier 3
    return NextResponse.json({ status: 'sudden_death', round: newRound });
  }
  // Not tied — higher score wins, go to fast money
  await supabase.from('games')
    .update({ status: 'fast_money' }).eq('id', round.game_id);
  return NextResponse.json({ status: 'game_won', winner_team: winningTeam?.id });
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "fix: 300-point win threshold and sudden death for ties"
```

---

### Task 5: Fix Point Multipliers (Absolute Round Numbers)

**Files:**
- Modify: `src/app/api/advance-round/route.ts:206-212`

- [ ] **Step 1: Replace relative multiplier with absolute**

Replace the relative calculation with the fixed schedule from `state-machine.ts`:

```typescript
// Replace lines 206-212 with:
function getServerPointMultiplier(roundNumber: number): number {
  if (roundNumber <= 2) return 1;
  if (roundNumber === 3) return 2;
  return 3; // round 4+
}

const pointMultiplier = getServerPointMultiplier(nextRoundNumber);
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "fix: point multipliers use absolute round numbers (1x,1x,2x,3x)"
```

---

### Task 6: Scoreboard Shows Pending Points Separately

**Files:**
- Modify: `src/components/tv/Scoreboard.tsx`
- Modify: `src/components/tv/GameBoard.tsx:81-83`

- [ ] **Step 1: Display round pot separately from team scores**

In `Scoreboard.tsx`, show `roundPoints` as a separate "POT" indicator between the two team scores, not added to either team's score:

```typescript
// Add a center "pot" display between team scores
{roundPoints !== undefined && roundPoints > 0 && (
  <div className="text-center">
    <p className="text-white/40 text-xs uppercase">Round Pot</p>
    <p className="text-[var(--color-gold)] text-3xl font-black">{roundPoints}</p>
  </div>
)}
```

Team scores should only show the actual `team.score` from the DB (which only updates at round end via `complete_round`).

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "fix: scoreboard shows pending points as separate pot, not in team scores"
```

---

### Task 7: Steal Team Tracking

**Files:**
- Modify: `src/app/api/advance-round/route.ts`
- Modify: DB schema (add `original_controlling_team` to rounds)

- [ ] **Step 1: Track original controlling team**

When transitioning to steal phase, the `controlling_team` should NOT change. Add logic so that when a steal attempt is judged, points go to the correct team:

- Steal succeeds → points go to the STEALING team (the one that wasn't controlling)
- Steal fails → points go to the ORIGINAL controlling team

In `judge-answer`, when `phase === 'steal'`:
- If correct: award points to `team_id` (the stealing team's ID, passed in the request)
- If incorrect: award points to `round.controlling_team` (the original team)

- [ ] **Step 2: Add complete_steal action to advance-round**

```typescript
case 'complete_steal': {
  // Receives: round_id, steal_success (boolean), stealing_team_id
  // If steal_success: award all round points to stealing_team_id
  // If !steal_success: award all round points to controlling_team
  // Then complete the round
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "fix: steal correctly awards points to winning team"
```

---

### Task 8: Timer Enforcement (3s Buzzer, 5s Main Round)

**Files:**
- Modify: `src/components/phone/PhoneController.tsx`
- Modify: `src/components/phone/BuzzerScreen.tsx`

- [ ] **Step 1: Pass context-dependent timer to AnswerScreen**

In PhoneController, pass different `timeLimit` based on phase:
```typescript
case 'face_off_answer':
  return <AnswerScreen ... timeLimit={10} ... />; // Face-off gets more time
case 'your_turn':
  return <AnswerScreen ... timeLimit={game?.settings.answer_window_seconds || 10} ... />;
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "fix: context-dependent answer timers per game phase"
```

---

### Task 9: Fast Money Duplicate Detection (Player 2 vs Player 1)

**Files:**
- Modify: `src/app/api/judge-answer/route.ts`

- [ ] **Step 1: Compare Player 2 answers against Player 1**

When `phase === 'fast_money'` and `is_player1 === false`:
```typescript
// Fetch Player 1's answers for this fast_money session
const { data: fmData } = await supabase
  .from('fast_money')
  .select('player1_answers')
  .eq('id', fast_money_id)
  .limit(1);

const p1Answers = (fmData?.[0]?.player1_answers as any[]) || [];
const p1AnswerForThisQuestion = p1Answers[question_index];

// If Player 2's answer matches Player 1's answer for the same question
if (p1AnswerForThisQuestion && matchedAnswer &&
    p1AnswerForThisQuestion.matched_rank === matchedAnswer.rank) {
  return NextResponse.json({
    is_correct: false,
    is_duplicate_of_player1: true,
    message: 'Try again!',
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "fix: Fast Money Player 2 duplicates trigger 'Try again!'"
```

---

### Task 10: Align Game Status State Machine

**Files:**
- Modify: `src/lib/game/state-machine.ts`

- [ ] **Step 1: Remove unused `main_round` status**

The server never sets `main_round` — it uses `face_off` as the game status and `playing` as the round phase. Simplify:

```typescript
export type GameStatus = 'lobby' | 'face_off' | 'fast_money' | 'finished';

const GAME_TRANSITIONS: Record<GameStatus, GameStatus[]> = {
  lobby: ['face_off'],
  face_off: ['face_off', 'fast_money', 'finished'], // face_off → face_off (next round)
  fast_money: ['finished'],
  finished: ['lobby'],
};
```

Update `src/types/game.ts` to match.

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "fix: align state machine with actual game status values"
```
