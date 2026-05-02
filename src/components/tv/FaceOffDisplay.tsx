'use client';

import { motion } from 'framer-motion';
import type { Player } from '@/types/game';

interface FaceOffDisplayProps {
  player1: Player;
  player2: Player;
  team1Color: string;
  team2Color: string;
  winnerId?: string | null;
  phase: 'waiting' | 'buzzing' | 'answering';
}

export function FaceOffDisplay({
  player1,
  player2,
  team1Color,
  team2Color,
  winnerId,
  phase,
}: FaceOffDisplayProps) {
  return (
    <div className="flex items-center justify-center gap-8 md:gap-16 py-8">
      {/* Player 1 */}
      <motion.div
        className="flex flex-col items-center gap-3"
        animate={{
          scale: winnerId === player1.id ? 1.1 : winnerId === player2.id ? 0.9 : 1,
          opacity: winnerId === player2.id ? 0.5 : 1,
        }}
      >
        <div
          className="w-20 h-20 md:w-28 md:h-28 rounded-full flex items-center justify-center text-3xl md:text-4xl font-black text-white shadow-lg"
          style={{ backgroundColor: team1Color }}
        >
          {player1.username[0].toUpperCase()}
        </div>
        <p className="text-xl md:text-2xl font-bold text-white">{player1.username}</p>
        {winnerId === player1.id && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[var(--color-gold)] font-bold"
          >
            BUZZED FIRST!
          </motion.p>
        )}
      </motion.div>

      {/* VS */}
      <motion.div
        animate={{
          scale: phase === 'buzzing' ? [1, 1.2, 1] : 1,
        }}
        transition={{
          repeat: phase === 'buzzing' ? Infinity : 0,
          duration: 0.8,
        }}
        className="text-4xl md:text-6xl font-black text-[var(--color-gold)] drop-shadow-[0_0_20px_rgba(255,215,0,0.4)]"
      >
        VS
      </motion.div>

      {/* Player 2 */}
      <motion.div
        className="flex flex-col items-center gap-3"
        animate={{
          scale: winnerId === player2.id ? 1.1 : winnerId === player1.id ? 0.9 : 1,
          opacity: winnerId === player1.id ? 0.5 : 1,
        }}
      >
        <div
          className="w-20 h-20 md:w-28 md:h-28 rounded-full flex items-center justify-center text-3xl md:text-4xl font-black text-white shadow-lg"
          style={{ backgroundColor: team2Color }}
        >
          {player2.username[0].toUpperCase()}
        </div>
        <p className="text-xl md:text-2xl font-bold text-white">{player2.username}</p>
        {winnerId === player2.id && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[var(--color-gold)] font-bold"
          >
            BUZZED FIRST!
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
