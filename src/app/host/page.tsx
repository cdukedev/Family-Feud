'use client';

import { useState, useEffect } from 'react';
import { Lobby } from '@/components/lobby/Lobby';
import { GameBoard } from '@/components/tv/GameBoard';
import { usePlayer } from '@/hooks/usePlayer';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { useGameStore } from '@/stores/gameStore';
import { createGame } from '@/lib/supabase/auth';
import { generateRoomCode } from '@/lib/game/room-code';
import { createClient } from '@/lib/supabase/client';
import { signInAnonymously } from '@/lib/supabase/auth';
import { getAvatarColor } from '@/lib/game/room-code';

export default function HostPage() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string>('');
  const [hostId, setHostId] = useState<string>('');
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

        // Sign in anonymously
        let { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          await signInAnonymously();
          const res = await supabase.auth.getSession();
          session = res.data.session;
        }

        // Create host player
        const { data: existingPlayers } = await supabase
          .from('players')
          .select('*')
          .eq('auth_id', session!.user.id)
          .limit(1);

        let playerId: string;
        if (existingPlayers && existingPlayers.length > 0) {
          playerId = existingPlayers[0].id;
        } else {
          const { data: newPlayers, error } = await supabase
            .from('players')
            .insert({
              auth_id: session!.user.id,
              username: 'Host',
              avatar_color: getAvatarColor(0),
            })
            .select();
          if (error || !newPlayers?.length) throw error || new Error('Failed to create player');
          playerId = newPlayers[0].id;
        }

        setHostId(playerId);

        // Generate room code and create game
        const code = generateRoomCode();
        const newGame = await createGame(playerId, code);
        setGameId(newGame.id);
        setRoomCode(newGame.room_code);

        // Store for session
        sessionStorage.setItem('gameId', newGame.id);
        sessionStorage.setItem('playerId', playerId);
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
    const supabase = createClient();

    // Start the first round
    await supabase
      .from('games')
      .update({ status: 'face_off', current_round: 1 })
      .eq('id', gameId);

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
      hostId={hostId}
      onGameStart={handleGameStart}
    />
  );
}
