'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { signInAnonymously, getPlayerByAuthId, createPlayer } from '@/lib/supabase/auth';
import { getAvatarColor } from '@/lib/game/room-code';
import { useGameStore } from '@/stores/gameStore';
import type { Player } from '@/types/game';

export function usePlayer() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentPlayer, setCurrentPlayer } = useGameStore();

  // Check for existing session on mount
  useEffect(() => {
    async function init() {
      try {
        const existing = await getPlayerByAuthId();
        if (existing) {
          setCurrentPlayer(existing as Player);
        }
      } catch {
        // No session yet — that's fine
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [setCurrentPlayer]);

  const register = useCallback(async (username: string): Promise<Player> => {
    setError(null);
    try {
      // Sign in anonymously if not already
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        await signInAnonymously();
      }

      // Check if player already exists
      const existing = await getPlayerByAuthId();
      if (existing) {
        setCurrentPlayer(existing as Player);
        return existing as Player;
      }

      // Create new player
      const playerCount = useGameStore.getState().players.length;
      const player = await createPlayer(username, getAvatarColor(playerCount));
      setCurrentPlayer(player as Player);
      return player as Player;
    } catch (err: any) {
      setError(err.message || 'Failed to register');
      throw err;
    }
  }, [setCurrentPlayer]);

  return { player: currentPlayer, loading, error, register };
}
