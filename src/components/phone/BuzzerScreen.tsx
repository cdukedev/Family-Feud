'use client';

import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/stores/gameStore';
import { callApi } from '@/lib/api';
import { motion } from 'framer-motion';

interface BuzzerScreenProps {
  roundId: string;
  playerId: string;
  teamId: string;
}

export function BuzzerScreen({ roundId, playerId, teamId }: BuzzerScreenProps) {
  const { buzzerArmed } = useGameStore();

  const handleBuzz = async () => {
    if (!buzzerArmed) return;

    try {
      await callApi('handle-buzz', {
        round_id: roundId,
        player_id: playerId,
        team_id: teamId,
        client_ts: Date.now(),
      });
    } catch (err) {
      console.error('Buzz failed:', err);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[var(--color-dark)] to-[#1a0000]">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-white/60 text-lg mb-8 text-center"
      >
        {buzzerArmed ? 'BUZZ IN!' : 'Wait for the question...'}
      </motion.p>

      <Button
        variant="buzzer"
        size="buzzer"
        pulsing={buzzerArmed}
        disabled={!buzzerArmed}
        onClick={handleBuzz}
      >
        {buzzerArmed ? 'BUZZ!' : '...'}
      </Button>

      {!buzzerArmed && (
        <motion.p
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-white/30 text-sm mt-8"
        >
          Listen to the question on the TV
        </motion.p>
      )}
    </div>
  );
}
