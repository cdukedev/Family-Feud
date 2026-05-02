'use client';

import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';

interface WaitingScreenProps {
  message?: string;
}

export function WaitingScreen({ message }: WaitingScreenProps) {
  const { currentRound, teams, players, answers, currentTurnPlayerId } = useGameStore();
  const turnPlayer = players.find((p) => p.id === currentTurnPlayerId);

  return (
    <div className="min-h-dvh flex flex-col p-6 bg-gradient-to-b from-[var(--color-dark)] to-[var(--color-board)]">
      {/* Current turn info */}
      <div className="text-center py-8">
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-white/60 text-lg"
        >
          {message || (turnPlayer
            ? `${turnPlayer.username} is answering...`
            : 'Watch the TV!')}
        </motion.p>
      </div>

      {/* Mini board showing revealed answers */}
      {answers.length > 0 && (
        <div className="flex-1 space-y-2 max-w-sm mx-auto w-full">
          <p className="text-white/40 text-sm uppercase tracking-wider mb-3">Board</p>
          {answers.map((answer) => {
            const isRevealed = currentRound?.revealed.includes(answer.rank);
            return (
              <div
                key={answer.id}
                className={`flex items-center justify-between px-4 py-2 rounded-lg ${
                  isRevealed
                    ? 'bg-[var(--color-board)] border border-[var(--color-gold)]/20'
                    : 'bg-white/5'
                }`}
              >
                <span className={`text-sm ${isRevealed ? 'text-white' : 'text-white/20'}`}>
                  {isRevealed ? answer.text : `#${answer.rank}`}
                </span>
                {isRevealed && (
                  <span className="text-[var(--color-gold)] font-bold text-sm">{answer.points}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Score */}
      {teams.length >= 2 && (
        <div className="mt-auto flex justify-between pt-6">
          {teams.map((team) => (
            <div key={team.id} className="text-center">
              <p className="text-white/40 text-xs uppercase">{team.name}</p>
              <p className="text-2xl font-bold text-white">{team.score}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
