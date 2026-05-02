'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Logo } from '@/components/ui/Logo';
import { usePlayer } from '@/hooks/usePlayer';
import { joinGame } from '@/lib/supabase/auth';
import { motion } from 'framer-motion';

export function JoinForm() {
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { register } = usePlayer();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !roomCode.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const player = await register(username.trim());
      const game = await joinGame(player.id, roomCode.trim());
      // Store game ID for the play page
      sessionStorage.setItem('gameId', game.id);
      sessionStorage.setItem('playerId', player.id);
      router.push('/play');
    } catch (err: any) {
      setError(err.message || 'Failed to join game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[var(--color-dark)] via-[var(--color-board)] to-[var(--color-dark)]">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Logo size="md" className="mb-8" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-sm"
      >
        <Card>
          <h2 className="text-xl font-bold text-center mb-6">Join Game</h2>

          <form onSubmit={handleJoin} className="space-y-4">
            <Input
              label="Your Name"
              placeholder="Uncle Steve, Mom, etc."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
              autoFocus
            />

            <Input
              label="Room Code"
              placeholder="e.g. FEUD"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={4}
              className="text-center tracking-widest text-2xl uppercase"
            />

            {error && (
              <p className="text-[var(--color-danger)] text-sm text-center">{error}</p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading || !username.trim() || !roomCode.trim()}
              className="w-full"
            >
              {loading ? 'Joining...' : 'Join Game'}
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
