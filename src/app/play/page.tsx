'use client';

import { useEffect, useState } from 'react';
import { PhoneController } from '@/components/phone/PhoneController';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { Logo } from '@/components/ui/Logo';

export default function PlayPage() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    const gid = sessionStorage.getItem('gameId');
    const pid = sessionStorage.getItem('playerId');
    setGameId(gid);
    setPlayerId(pid);
  }, []);

  const { fetchFullState } = useRealtimeSync(gameId);

  useEffect(() => {
    if (gameId) fetchFullState();
  }, [gameId]);

  if (!gameId || !playerId) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-[var(--color-dark)]">
        <Logo size="md" className="mb-6" />
        <p className="text-white/60 text-center">
          No game found. Please join a game first.
        </p>
        <a href="/join" className="mt-4 text-[var(--color-primary)] underline">
          Join a Game
        </a>
      </div>
    );
  }

  return <PhoneController playerId={playerId} gameId={gameId} />;
}
