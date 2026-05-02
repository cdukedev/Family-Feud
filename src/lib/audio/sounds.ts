'use client';

import { audioPlayer } from './player';

export type SoundEffect =
  | 'ding'
  | 'buzzer'
  | 'strike'
  | 'theme'
  | 'applause'
  | 'confetti'
  | 'tick'
  | 'reveal';

const SOUND_PATHS: Record<SoundEffect, string> = {
  ding: '/sounds/ding.mp3',
  buzzer: '/sounds/buzzer.mp3',
  strike: '/sounds/strike.mp3',
  theme: '/sounds/theme.mp3',
  applause: '/sounds/applause.mp3',
  confetti: '/sounds/confetti.mp3',
  tick: '/sounds/tick.mp3',
  reveal: '/sounds/reveal.mp3',
};

// Preload all sounds
const preloaded = new Map<string, HTMLAudioElement>();

export function preloadSounds() {
  Object.entries(SOUND_PATHS).forEach(([key, path]) => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = path;
    preloaded.set(key, audio);
  });
}

export function playSound(effect: SoundEffect) {
  const cached = preloaded.get(effect);
  if (cached) {
    const clone = cached.cloneNode() as HTMLAudioElement;
    clone.play().catch(() => {});
    return;
  }

  const path = SOUND_PATHS[effect];
  if (path) {
    audioPlayer.play(path).catch(() => {});
  }
}
