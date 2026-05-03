# AI Agent Integration Audit — 24 Opportunities Found

## Current State: The host is SILENT

The app has all the AI infrastructure built but none of it is wired up:
- `host-dialogue` API exists but **no component ever calls it**
- `tts-generate` API exists but **no audio is ever played**
- `MicButton` component is fully built but **AnswerScreen shows a disabled placeholder instead**
- 8 sound effects are loaded but **none are ever triggered**
- `useAudio` hook exists but **no component uses it**

---

## Priority Ranking (by Impact × Effort)

### Tier 1: LOW EFFORT, HIGH IMPACT (wire up existing code)

| # | Feature | Impact | Effort | What |
|---|---------|--------|--------|------|
| 1 | Sound effects | HIGH | LOW | Wire existing `playSound()` to game events (ding, strike, theme, applause) |
| 2 | MicButton integration | HIGH | LOW | Replace disabled placeholder in AnswerScreen with the real MicButton component |
| 3 | Player name calling | HIGH | LOW | Already in Gemini prompt — just need to invoke host-dialogue |
| 4 | 200pt celebration audio | HIGH | LOW | Trigger confetti + applause sounds when Fast Money hits 200 |
| 5 | SSML dramatic pauses | MED | LOW | TTS route already supports SSML — just send it |

### Tier 2: MEDIUM EFFORT, HIGH IMPACT (new integrations)

| # | Feature | Impact | Effort | What |
|---|---------|--------|--------|------|
| 6 | Host reads questions aloud | HIGH | MED | Call host-dialogue → tts-generate → play audio → THEN arm buzzers |
| 7 | Host reacts to answers | HIGH | MED | After judge-answer, call host-dialogue for vocal reaction |
| 8 | "Survey says..." moment | HIGH | MED | Host repeats answer + dramatic pause before revealing result |
| 9 | Fast Money dramatic reveal | HIGH | MED | Sequential reveal with host voice, not instant data dump |
| 10 | Countdown voice pressure | HIGH | MED | Pre-cached "10 seconds!", "5 seconds!", "I need an answer!" |
| 11 | Score announcements | HIGH | MED | Host announces scores and round transitions vocally |

### Tier 3: MEDIUM EFFORT, MEDIUM IMPACT (personality & memory)

| # | Feature | Impact | Effort | What |
|---|---------|--------|--------|------|
| 12 | Few-shot Gemini judging | MED | LOW | Add examples to judge prompt for better accuracy |
| 13 | Session memory (callbacks) | MED | MED | host_memory table → "Your brother said the same thing!" |
| 14 | Override reactions | MED | LOW | Host dialogue when answer is overridden |
| 15 | Score differential commentary | MED | LOW | "It's NECK AND NECK!" / "They're making a COMEBACK!" |
| 16 | Adaptive pacing | MED | MED | Slow down for drama, speed up for blowouts |
| 17 | Personalized banter | MED | MED | Jokes using player names and previous answers |
| 18 | Consolation dialogue | MED | LOW | Host comfort when Fast Money < 200 |

### Tier 4: HIGH EFFORT, HIGH IMPACT (architectural)

| # | Feature | Impact | Effort | What |
|---|---------|--------|--------|------|
| 19 | AI Game Director | HIGH | HIGH | Server-side orchestrator that automates flow: question → TTS → arm buzzers → answer → react → next turn |
| 20 | Pre-cached common phrases | MED | MED | Generate "Good answer!", "Strike!" etc. at game start for instant playback |

### Tier 5: FUTURE VISION (requires new infrastructure)

| # | Feature | Impact | Effort | What |
|---|---------|--------|--------|------|
| 21 | STT improvements (kids, accents) | MED | MED | Confidence thresholds, phrase hints, language options |
| 22 | Real-time streaming voice agent | HIGH | VERY HIGH | Gemini Live / WebRTC — host has real conversations |
| 23 | Conversational host-player chat | HIGH | VERY HIGH | Players talk back to the host between rounds |
| 24 | AI explanation of judging | LOW | LOW | Show reasoning in host override panel |

---

## Key Architectural Recommendation

Create a **`useHostVoice` hook** on the TV display that:
1. Subscribes to Supabase Realtime events
2. On each game event → calls host-dialogue for text
3. Wraps in SSML → sends to tts-generate
4. Coordinates: sound effect FIRST, then host voice, then advance game state
5. Emits completion events (so buzzers arm AFTER question is read aloud)

This single hook connects items 1, 6, 7, 8, 9, 10, 11 — transforming the silent game into a TV show.
