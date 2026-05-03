# Family Feud — Complete QA Journey
# Every step from game creation to final scores

> This QA journey tests every game mechanic against the official TV rules.
> The Host is ALWAYS the TV display — never a player.
> 4 players: Mom, Dad, Sis, Bro — on their phones.

---

## Phase 1: PRE-GAME (Lobby)

### Test 1.1: Landing Page
- [ ] Navigate to / — see FAMILY FEUD logo, "Host New Game" and "Join Game" buttons
- [ ] No console errors, no 404s
- [ ] Responsive: looks good on desktop (TV) and mobile (phone)

### Test 1.2: Host Creates Game (TV Display)
- [ ] Click "Host New Game" → lobby appears on /host
- [ ] Room code generated (4 letters) and displayed prominently
- [ ] QR code rendered and scannable
- [ ] Join URL shown
- [ ] **Host does NOT create a player record** (host is the TV, not a contestant)
- [ ] Players list shows 0 initially

### Test 1.3: Player 1 (Mom) Joins
- [ ] Open /join on a separate device/tab
- [ ] Enter name "Mom" and room code
- [ ] Click "Join Game" → redirects to /play
- [ ] Phone shows "Waiting for the game to start..."
- [ ] TV lobby updates to show "Mom" in player list within 3 seconds

### Test 1.4: Players 2-4 Join (Dad, Sis, Bro)
- [ ] Each player joins from separate device
- [ ] TV lobby shows all 4 players
- [ ] Each player has unique avatar color
- [ ] "Set Up Teams (4 players)" button appears

### Test 1.5: Team Assignment
- [ ] Click "Set Up Teams"
- [ ] All 4 players shown as unassigned
- [ ] "Random Split" assigns 2 per team
- [ ] Manual drag: can move players between teams
- [ ] Team names editable
- [ ] "Shuffle Order" randomizes play order within team
- [ ] "Lock Teams & Start Game" button activates when both teams have players
- [ ] Example: Team 1 = Mom, Bro | Team 2 = Dad, Sis

---

## Phase 2: FACE-OFF (Round 1)

### Test 2.1: Game Start → Round 1 Created
- [ ] Click "Lock Teams & Start Game"
- [ ] `/api/advance-round` called with `action: start_game`
- [ ] Round 1 created with a random question from DB
- [ ] Game status transitions to `face_off`
- [ ] TV shows: question text, Face-Off display (Player 1 from Team 1 VS Player 1 from Team 2)

### Test 2.2: Face-Off Players See Buzzers
- [ ] **BOTH** face-off players (e.g., Mom AND Dad) see the BUZZER screen on their phone
- [ ] Buzzer is DISABLED initially (greyed out, shows "...")
- [ ] Non-face-off players (Sis, Bro) see "Face-Off in progress! Watch the TV!"
- [ ] TV shows pulsing "VS" between the two face-off players

### Test 2.3: AI Host Reads Question (Future: Voice)
- [ ] AI host generates dialogue: "We surveyed 100 people..."
- [ ] TTS plays the question aloud on TV speakers
- [ ] **After question finishes reading**, buzzers ARM on both phones
- [ ] Buzzers glow/pulse, vibrate lightly

### Test 2.4: Buzz In
- [ ] Both players can tap the buzzer
- [ ] First to buzz → their phone transitions to ANSWER screen with timer
- [ ] Second player's phone shows "Wait..." then also transitions to ANSWER screen
- [ ] TV shows "BUZZED FIRST!" under the first buzzer

### Test 2.5: Both Players Answer
- [ ] First buzzer (e.g., Mom): sees text input + mic button + countdown timer
- [ ] Mom types "French Fries" and submits
- [ ] `/api/judge-answer` called → returns match result (but does NOT yet determine face-off winner)
- [ ] Second player (Dad): also gets answer screen
- [ ] Dad types "Hot Dog" and submits
- [ ] Both answers judged against the board

### Test 2.6: Face-Off Winner Determined by RANK
- [ ] "French Fries" = Rank 1 (38 pts), "Hot Dog" = Rank 3 (15 pts)
- [ ] Mom wins because her answer RANKS HIGHER (#1 vs #3)
- [ ] TV shows Mom's tile flip with ding, then Dad's tile flip
- [ ] Mom's phone shows "PLAY or PASS?" screen
- [ ] **NOT determined by who buzzed first** — determined by answer rank

### Test 2.7: Edge Case — Only One Answer on Board
- [ ] If Mom says "French Fries" (on board) and Dad says "Pizza" (not on board)
- [ ] Mom wins automatically (only answer on board)
- [ ] Dad gets a strike indicator but no tile flip

### Test 2.8: Edge Case — Neither Answer on Board
- [ ] If both answers miss → next pair faces off (Bro vs Sis)
- [ ] Same question, buzzers rearm for the new pair
- [ ] Original pair returns to "Watch the TV" waiting screen

### Test 2.9: Play or Pass Decision
- [ ] Face-off winner (Mom) sees two large buttons: "PLAY" and "PASS"
- [ ] If PLAY: Mom's team (Team 1) takes control
- [ ] If PASS: opposing team (Team 2) takes control
- [ ] TV updates to show controlling team highlighted
- [ ] All other phones update accordingly

---

## Phase 3: MAIN ROUND (Playing)

### Test 3.1: Turn Rotation
- [ ] Controlling team answers in `player_order` sequence
- [ ] The face-off player already answered, so next player in rotation goes first
- [ ] That player's phone lights up with answer input + timer
- [ ] All other players see "It's [Name]'s turn" + mini board

### Test 3.2: Correct Answer
- [ ] Player types an answer that's on the board
- [ ] `/api/judge-answer` returns `is_correct: true`
- [ ] TV: tile flips with DING sound, points shown on tile
- [ ] Points accumulate in a PENDING POT (not added to team score yet)
- [ ] Player's phone shows green checkmark "Correct!"
- [ ] AI host reacts: "Good answer! Good answer!"
- [ ] Next player in rotation gets their turn

### Test 3.3: Wrong Answer → Strike
- [ ] Player types an answer NOT on the board
- [ ] `/api/judge-answer` returns `is_correct: false`
- [ ] TV: big red X STRIKE overlay with buzzer sound
- [ ] Strike indicator updates (1/3, 2/3, 3/3)
- [ ] Player's phone shows red X "Not on the board"
- [ ] AI host reacts: "Ohhh, that's a strike!"
- [ ] Next player in rotation gets their turn

### Test 3.4: Duplicate Answer → STRIKE (per TV rules)
- [ ] Player says an answer that's already been revealed
- [ ] `/api/judge-answer` returns `is_correct: false, is_duplicate: true`
- [ ] **This counts as a STRIKE** (not a free retry)
- [ ] Strike indicator increments
- [ ] AI host: "That's already up there!"
- [ ] Next player in rotation gets their turn

### Test 3.5: All Answers Revealed Before 3 Strikes
- [ ] Controlling team reveals every answer on the board
- [ ] Round ends immediately — team wins ALL points
- [ ] Points banked to team score with counting animation
- [ ] AI host celebrates
- [ ] Move to next round

### Test 3.6: Three Strikes → Steal Opportunity
- [ ] Third strike hits
- [ ] TV: triple X overlay with dramatic buzzer
- [ ] Controlling team locked out
- [ ] Opposing team's phones all show STEAL HUDDLE screen

---

## Phase 4: STEAL

### Test 4.1: Team Huddle
- [ ] Stealing team gets 30-second team chat
- [ ] All team members can type suggestions
- [ ] One designated player sees "Submit Steal Answer" button
- [ ] Chat messages visible to all team members in real-time

### Test 4.2: Steal Answer Submitted
- [ ] Designated player submits one answer
- [ ] `/api/judge-answer` checks against remaining unrevealed answers
- [ ] Need to match ONLY ONE remaining answer to steal

### Test 4.3: Successful Steal
- [ ] Answer matches a remaining board answer
- [ ] **Stealing team gets ALL accumulated round points**
- [ ] TV: remaining answers revealed, points awarded to stealing team
- [ ] AI host: "STEAL! [Team] takes the points!"
- [ ] Team score updates with animation

### Test 4.4: Failed Steal
- [ ] Answer doesn't match any remaining answer
- [ ] **Original controlling team keeps ALL points**
- [ ] TV: remaining answers revealed, points awarded to original team
- [ ] AI host: "Oh no! [Original team] keeps the points!"
- [ ] Score updates accordingly

---

## Phase 5: SCORING & ROUND PROGRESSION

### Test 5.1: Point Multipliers
- [ ] Round 1: all answer points × 1
- [ ] Round 2: all answer points × 1
- [ ] Round 3: all answer points × 2
- [ ] Round 4: all answer points × 3
- [ ] TV shows multiplier badge: "2x POINTS", "3x POINTS"

### Test 5.2: Points Banked at Round End
- [ ] During play: pending points shown separately (not in team score)
- [ ] After round resolves: team score animates upward with counting effect
- [ ] Scoreboard shows final scores

### Test 5.3: 300-Point Win Threshold
- [ ] If a team reaches 300 points mid-game → game ends immediately
- [ ] That team wins and goes to Fast Money
- [ ] No need to complete all 4 rounds

### Test 5.4: Round Transition
- [ ] After round completes, new face-off begins
- [ ] Next players in rotation face off (Player 2 vs Player 2)
- [ ] New question selected from DB
- [ ] Point multiplier updates for the new round

### Test 5.5: Tied After 4 Rounds → Sudden Death
- [ ] If scores are tied after Round 4
- [ ] One additional triple-value face-off round
- [ ] Winner of sudden death wins the game

---

## Phase 6: FAST MONEY

### Test 6.1: Player Selection
- [ ] Winning team selects 2 players for Fast Money
- [ ] Order matters: Player 1 (20 seconds), Player 2 (25 seconds)

### Test 6.2: Player 2 Sequestered
- [ ] Player 2's phone immediately locks into SEQUESTER screen
- [ ] Purple background, animated waiting graphic, music playing
- [ ] No game information visible
- [ ] Cannot navigate away

### Test 6.3: Player 1 Plays (20 seconds)
- [ ] TV shows 5 empty answer rows, 20-second timer
- [ ] AI host: "You need 200 points! First thing that comes to mind!"
- [ ] 5 questions rapid-fire via TTS
- [ ] Player 1 answers each (mic or text) — locks in immediately
- [ ] TV shows "[LOCKED]" for each answer (points hidden)
- [ ] If no answer in 5 seconds → "I need an answer!"
- [ ] If 8 seconds → "No Answer" (0 points), move to next question
- [ ] If master timer expires → remaining questions score 0

### Test 6.4: Player 2 Plays (25 seconds)
- [ ] Sequester screen clears
- [ ] Same 5 questions, 25-second timer
- [ ] If Player 2 gives SAME answer as Player 1 → "Try again!" (no strike, costs time)
- [ ] Clock does NOT pause during "Try again"

### Test 6.5: Grand Reveal
- [ ] Both players face the TV
- [ ] Two-column layout: Player 1 left, Player 2 right
- [ ] Reveal one question at a time, top to bottom
- [ ] For each: "Player 1 said [answer]... Survey says..." → 2-second dramatic pause → points appear
- [ ] Running total updates after each reveal
- [ ] If total hits 200+ → CONFETTI, celebration music, AI host goes wild
- [ ] If under 200 → consolation: "You played a great game!"

---

## Phase 7: GAME OVER

### Test 7.1: Final Scores
- [ ] TV shows final scores with winner celebration
- [ ] Winner highlighted with 1st place badge
- [ ] Both teams' scores displayed

### Test 7.2: Play Again
- [ ] "Play Again?" button on phones
- [ ] Creates new game with same players
- [ ] Returns to lobby

---

## Phase 8: AI HOST QUALITY (Future Enhancement Tests)

### Test 8.1: Host Voice
- [ ] Host reads every question aloud before buzzer arms
- [ ] Host reacts to every answer with vocal feedback
- [ ] Host calls players by name
- [ ] Host uses SSML dramatic pauses during reveals

### Test 8.2: Host Personality
- [ ] Consistent enthusiastic personality throughout
- [ ] Family-friendly jokes
- [ ] Callbacks to earlier events ("Your brother said the same thing!")

### Test 8.3: Sound Effects
- [ ] Ding on correct answer
- [ ] Buzzer on wrong answer
- [ ] Strike X sound
- [ ] Theme music at game start
- [ ] Applause at round wins
- [ ] Confetti + celebration at Fast Money 200+
