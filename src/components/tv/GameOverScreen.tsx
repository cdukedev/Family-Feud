'use client';

import { motion } from 'framer-motion';
import { Logo } from '@/components/ui/Logo';
import type { Team } from '@/types/game';

interface GameOverScreenProps {
  teams: Team[];
}

export function GameOverScreen({ teams }: GameOverScreenProps) {
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
  const winner = sortedTeams[0];
  const isTied = sortedTeams.length >= 2 && sortedTeams[0].score === sortedTeams[1].score;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-[var(--color-dark)] via-[var(--color-board)] to-[var(--color-dark)] p-8">
      <Logo size="lg" className="mb-8" />

      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 10 }}
        className="text-center mb-12"
      >
        {isTied ? (
          <h2 className="text-4xl md:text-6xl font-black text-[var(--color-gold)]">
            IT&apos;S A TIE!
          </h2>
        ) : (
          <>
            <h2 className="text-3xl md:text-5xl font-black text-[var(--color-gold)] mb-2">
              {winner?.name}
            </h2>
            <p className="text-xl md:text-2xl text-white/80">WINS!</p>
          </>
        )}
      </motion.div>

      <div className="flex gap-8 md:gap-16">
        {sortedTeams.map((team, idx) => (
          <motion.div
            key={team.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.2 }}
            className="text-center"
          >
            <div
              className="w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
              style={{ backgroundColor: team.color }}
            >
              <span className="text-3xl md:text-5xl font-black text-white">
                {idx === 0 && !isTied ? '1st' : idx === 1 ? '2nd' : ''}
              </span>
            </div>
            <p className="text-lg md:text-xl font-bold text-white">{team.name}</p>
            <p className="text-3xl md:text-4xl font-black text-white mt-2">{team.score}</p>
            <p className="text-white/40 text-sm">points</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
