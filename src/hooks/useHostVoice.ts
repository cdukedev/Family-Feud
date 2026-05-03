'use client';

import { useCallback, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useAudio } from './useAudio';

export function useHostVoice(enabled: boolean = true) {
  const { play, playHostLine, stopAll } = useAudio();
  const { game } = useGameStore();
  const lastEventRef = useRef<string>('');

  const speak = useCallback(async (
    eventType: string,
    context: Record<string, any>,
  ) => {
    if (!enabled) return;

    // Deduplicate — don't repeat the same event
    const eventKey = `${eventType}:${JSON.stringify(context).substring(0, 100)}`;
    if (lastEventRef.current === eventKey) return;
    lastEventRef.current = eventKey;

    try {
      // 1. Generate host dialogue via Gemini
      const dialogueRes = await fetch('/api/host-dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_type: eventType, context }),
      });
      const { dialogue } = await dialogueRes.json();
      if (!dialogue) return;

      // 2. Generate TTS audio
      const voice = (game?.settings as any)?.host_voice || 'en-US-Neural2-D';
      const ttsRes = await fetch('/api/tts-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: dialogue, voice }),
      });
      const ttsData = await ttsRes.json();

      if (ttsData.audio_base64) {
        // 3. Play the audio from base64
        const audioUrl = `data:audio/mp3;base64,${ttsData.audio_base64}`;
        playHostLine(audioUrl);
      }
    } catch (err) {
      console.warn('Host voice error:', err);
      // Silently fail — game continues without voice
    }
  }, [enabled, game?.settings, playHostLine]);

  return { speak, play, stopAll };
}
