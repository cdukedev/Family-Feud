'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Player } from '@/types/game';

interface PlayerListProps {
  players: Player[];
  hostId?: string;
}

export function PlayerList({ players, hostId }: PlayerListProps) {
  return (
    <div className="space-y-2">
      <p className="text-white/60 text-sm uppercase tracking-wider">
        Players ({players.length})
      </p>

      <AnimatePresence>
        {players.map((player, index) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: player.avatar_color || '#457B9D' }}
            >
              {player.username[0].toUpperCase()}
            </div>

            <span className="text-white font-medium flex-1">{player.username}</span>

            {player.id === hostId && (
              <span className="text-xs bg-[var(--color-gold)]/20 text-[var(--color-gold)] px-2 py-0.5 rounded-full">
                HOST
              </span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {players.length === 0 && (
        <p className="text-white/30 text-center py-4">Waiting for players to join...</p>
      )}
    </div>
  );
}
