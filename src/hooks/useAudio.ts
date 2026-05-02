'use client';

import { useEffect, useCallback } from 'react';
import { preloadSounds, playSound, type SoundEffect } from '@/lib/audio/sounds';
import { audioPlayer } from '@/lib/audio/player';

export function useAudio() {
  useEffect(() => {
    preloadSounds();
  }, []);

  const play = useCallback((effect: SoundEffect) => {
    playSound(effect);
  }, []);

  const playHostLine = useCallback((audioUrl: string) => {
    audioPlayer.enqueue(audioUrl);
  }, []);

  const stopAll = useCallback(() => {
    audioPlayer.stop();
  }, []);

  return { play, playHostLine, stopAll };
}
