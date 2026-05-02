'use client';

import { Button } from '@/components/ui/Button';
import { callApi } from '@/lib/api';
import { motion } from 'framer-motion';

interface PlayOrPassScreenProps {
  roundId: string;
  playerTeamId: string;
  opponentTeamId: string;
  playerTeamName: string;
  opponentTeamName: string;
}

export function PlayOrPassScreen({
  roundId,
  playerTeamId,
  opponentTeamId,
  playerTeamName,
  opponentTeamName,
}: PlayOrPassScreenProps) {
  const handleChoice = async (choice: 'play' | 'pass') => {
    const controllingTeam = choice === 'play' ? playerTeamId : opponentTeamId;

    await callApi('advance-round', {
      round_id: roundId,
      action: 'play_or_pass',
      controlling_team: controllingTeam,
    });
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[var(--color-dark)] to-[var(--color-board)]">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <p className="text-[var(--color-gold)] text-xl font-bold mb-2">You won the Face-Off!</p>
        <p className="text-white/60 text-lg">Do you want to play or pass?</p>
      </motion.div>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <Button
          variant="primary"
          size="xl"
          onClick={() => handleChoice('play')}
          className="w-full"
        >
          PLAY
          <span className="block text-sm font-normal opacity-70 mt-1">
            {playerTeamName} answers
          </span>
        </Button>

        <Button
          variant="secondary"
          size="xl"
          onClick={() => handleChoice('pass')}
          className="w-full"
        >
          PASS
          <span className="block text-sm font-normal opacity-70 mt-1">
            {opponentTeamName} answers
          </span>
        </Button>
      </div>
    </div>
  );
}
