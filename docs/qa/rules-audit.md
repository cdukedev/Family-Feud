# Rules Compliance Audit — 12 Discrepancies Found

## CRITICAL (Game logic fundamentally wrong)

### 1. Host is a player (should be TV-only)
- **Rule**: Host is the emcee/TV — never a contestant
- **Code**: `host/page.tsx` creates a player record with username "Host", stores as playerId, gets drafted onto teams
- **Fix**: Host should NOT create a player record. The host page is the TV display only. Remove player creation from host flow.

### 2. Face-off winner determined by buzz speed (should be answer rank)
- **Rule**: Both players buzz in, both answer. The player whose answer ranks HIGHER wins. First to buzz only determines who answers first.
- **Code**: `handle-buzz` immediately sets `face_off_winner` for whoever buzzes first. Second player never gets to answer.
- **Fix**: Buzz determines answer ORDER only. Both players must answer. New comparison step determines winner by rank.

### 3. Second face-off player never answers; no re-face-off
- **Rule**: If neither answer is on the board, next pair faces off on same question
- **Code**: No re-face-off path exists
- **Fix**: Add "neither on board" flow that increments pair index and rearms buzzers

### 4. Duplicates don't count as strikes
- **Rule**: Duplicate answers ARE strikes in main round
- **Code**: `judge-answer` detects duplicates but returns early WITHOUT incrementing strikes
- **Fix**: Add strike increment in duplicate branch

### 5. No 300-point winning threshold
- **Rule**: First to 300 wins. Game ends immediately when threshold reached.
- **Code**: Game ends after N rounds regardless of score
- **Fix**: Check score after awarding points; end game if >= 300

## HIGH (Missing game mechanics)

### 6. No sudden death when tied
- **Rule**: If tied after 4 rounds, sudden death triple-value face-off
- **Code**: Tied games just end
- **Fix**: Create sudden death round with 3x multiplier

### 7. Point multipliers calculated wrong
- **Rule**: Round 1=1x, 2=1x, 3=2x, 4=3x (fixed schedule)
- **Code**: Server calculates relative to total_rounds (wrong if setting changes)
- **Fix**: Use absolute round numbers like state-machine.ts does

### 8. Points shown during play (should be banked at end)
- **Rule**: Points banked at round end, not during play
- **Code**: TV scoreboard shows live accumulating points during play
- **Fix**: Show pending points separately, update team score only at round end

### 9. Steal awards points to wrong team on failure
- **Rule**: If steal fails, ORIGINAL controlling team keeps points
- **Code**: No tracking of original vs stealing team
- **Fix**: Add stealing_team tracking, award correctly on steal outcome

## MEDIUM (Timer/UX issues)

### 10. No correct timer enforcement (3s buzzer, 5s answer)
- **Rule**: 3-second buzzer window, 5-second answer window
- **Code**: Everything uses 10-second default
- **Fix**: Context-dependent timers per phase

### 11. Game status `main_round` never used
- **Rule**: State machine defines it but server never sets it
- **Fix**: Align state machine with actual usage

### 12. Fast Money duplicate detection missing
- **Rule**: Player 2 duplicating Player 1 = "Try again!" (not a strike)
- **Code**: No comparison between Player 1 and Player 2 answers
- **Fix**: Compare against Player 1's answers before scoring
