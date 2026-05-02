'use client';

import { motion } from 'framer-motion';

interface AnswerTileProps {
  rank: number;
  text: string;
  points: number;
  revealed: boolean;
  multiplier?: number;
}

export function AnswerTile({ rank, text, points, revealed, multiplier = 1 }: AnswerTileProps) {
  const displayPoints = points * multiplier;

  return (
    <div className="perspective-[800px] w-full">
      <motion.div
        className="relative w-full h-16 md:h-20"
        initial={false}
        animate={{ rotateX: revealed ? 180 : 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front face — unrevealed */}
        <div
          className="absolute inset-0 flex items-center justify-center bg-[var(--color-secondary)] rounded-lg border-2 border-[var(--color-secondary)]/50 shadow-lg"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="text-3xl md:text-4xl font-black text-white/80">{rank}</span>
        </div>

        {/* Back face — revealed answer */}
        <div
          className="absolute inset-0 flex items-center px-4 md:px-6 bg-gradient-to-r from-[#1a3a5c] to-[#1D3557] rounded-lg border-2 border-[var(--color-gold)]/30 shadow-[0_0_15px_rgba(255,215,0,0.1)]"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateX(180deg)',
          }}
        >
          <span className="flex-1 text-lg md:text-2xl font-bold text-white uppercase tracking-wide truncate">
            {text}
          </span>
          <span className="text-2xl md:text-3xl font-black text-[var(--color-gold)] ml-4 min-w-[60px] text-right">
            {displayPoints}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
