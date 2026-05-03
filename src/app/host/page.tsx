'use client';

import { useState, useEffect } from 'react';
import { Lobby } from '@/components/lobby/Lobby';
import { GameBoard } from '@/components/tv/GameBoard';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { useGameStore } from '@/stores/gameStore';
import { createGame, signInAnonymously } from '@/lib/supabase/auth';
import { generateRoomCode } from '@/lib/game/room-code';
import { createClient } from '@/lib/supabase/client';

export default function HostPage() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string>('');
  const [gameStarted, setGameStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const { game } = useGameStore();

  // Set up realtime sync
  useRealtimeSync(gameId);

  // Create game on mount
  useEffect(() => {
    async function initGame() {
      try {
        const supabase = createClient();

        // Sign in anonymously (for Supabase auth)
        let { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          await signInAnonymously();
          const res = await supabase.auth.getSession();
          session = res.data.session;
        }

        // Generate room code and create game using auth uid as host_player
        const code = generateRoomCode();
        const newGame = await createGame(session!.user.id, code);

        setGameId(newGame.id);
        setRoomCode(newGame.room_code);

        // Store for session
        sessionStorage.setItem('gameId', newGame.id);
      } catch (err) {
        console.error('Failed to create game:', err);
      } finally {
        setLoading(false);
      }
    }

    initGame();
  }, []);

  const handleGameStart = async () => {
    if (!gameId) return;

    const response = await fetch('/api/advance-round', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game_id: gameId, action: 'start_game' }),
    });

    if (!response.ok) {
      console.error('Failed to start game:', await response.text());
    }

    setGameStarted(true);
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--color-dark)]">
        <div className="text-white/60 text-xl animate-pulse">Setting up game...</div>
      </div>
    );
  }

  if (!gameId) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--color-dark)]">
        <div className="text-[var(--color-danger)] text-xl">Failed to create game</div>
      </div>
    );
  }

  if (gameStarted || (game && game.status !== 'lobby')) {
    return <GameBoard gameId={gameId} />;
  }

  return (
    <Lobby
      gameId={gameId}
      roomCode={roomCode}
      onGameStart={handleGameStart}
    />
  );
}
