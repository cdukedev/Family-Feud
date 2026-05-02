'use client';

import { useState, useEffect } from 'react';
import { QRCodeDisplay } from './QRCode';
import { PlayerList } from './PlayerList';
import { TeamSetup } from './TeamSetup';
import { Logo } from '@/components/ui/Logo';
import { useGameStore } from '@/stores/gameStore';
import { createClient } from '@/lib/supabase/client';
import type { Player } from '@/types/game';

interface LobbyProps {
  gameId: string;
  roomCode: string;
  hostId: string;
  onGameStart: () => void;
}

export function Lobby({ gameId, roomCode, hostId, onGameStart }: LobbyProps) {
  const [phase, setPhase] = useState<'waiting' | 'teams'>('waiting');
  const { players, setPlayers } = useGameStore();

  // Subscribe to players joining
  useEffect(() => {
    const supabase = createClient();

    // Fetch players who have joined THIS game
    async function fetchPlayers() {
      const { data: gamePlayers } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', gameId);

      if (gamePlayers) setPlayers(gamePlayers as Player[]);
    }
    fetchPlayers();

    // Listen for ANY player changes (filter can miss INSERT→UPDATE race)
    const channel = supabase
      .channel(`lobby:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
        },
        () => {
          fetchPlayers();
        },
      )
      .subscribe();

    // Poll every 3s as fallback (Realtime filter may miss UPDATE from null→gameId)
    const poll = setInterval(fetchPlayers, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [gameId, setPlayers]);

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/join`
    : '/join';

  if (phase === 'teams') {
    return (
      <div className="min-h-dvh p-8 bg-gradient-to-b from-[var(--color-dark)] via-[var(--color-board)] to-[var(--color-dark)]">
        <Logo size="sm" className="mb-6" />
        <div className="max-w-2xl mx-auto">
          <TeamSetup
            players={players}
            gameId={gameId}
            onComplete={onGameStart}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-8 bg-gradient-to-b from-[var(--color-dark)] via-[var(--color-board)] to-[var(--color-dark)]">
      <Logo size="lg" className="mb-10" />

      <div className="flex flex-col lg:flex-row gap-12 items-center max-w-4xl w-full">
        <div className="flex-1">
          <QRCodeDisplay roomCode={roomCode} joinUrl={joinUrl} />
        </div>

        <div className="flex-1 w-full max-w-sm">
          <PlayerList players={players} hostId={hostId} />

          {players.length >= 2 && (
            <button
              onClick={() => setPhase('teams')}
              className="mt-6 w-full py-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white font-bold text-xl rounded-xl transition-colors cursor-pointer"
            >
              Set Up Teams ({players.length} players)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
