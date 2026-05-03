'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import React, { useEffect, useRef } from 'react';
import type { Team } from '@/types/game';

interface ScoreboardProps {
  teams: Team[];
  roundPoints?: number;
  controllingTeamId?: string | null;
}

function AnimatedScore({ score }: { score: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prevScore = useRef(score);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const from = prevScore.current;
    const to = score;
    prevScore.current = score;

    if (from === to) {
      node.textContent = String(to);
      return;
    }

    const duration = 1000;
    const start = performance.now();

    function step(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
      const current = Math.round(from + (to - from) * eased);
      if (node) node.textContent = String(current);
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }, [score]);

  return <span ref={ref}>{score}</span>;
}

export function Scoreboard({ teams, roundPoints, controllingTeamId }: ScoreboardProps) {
  if (teams.length < 2) return null;

  return (
    <div className="flex items-stretch justify-between gap-4 w-full max-w-4xl mx-auto">
      {teams.map((team, idx) => (
        <React.Fragment key={team.id}>
          <motion.div
            className={`
              flex-1 flex flex-col items-center p-4 md:p-6 rounded-2xl
              ${team.id === controllingTeamId ? 'ring-2 ring-[var(--color-gold)] shadow-[0_0_20px_rgba(255,215,0,0.2)]' : ''}
            `}
            style={{
              backgroundColor: team.color + '20',
              borderLeft: idx === 0 ? `4px solid ${team.color}` : undefined,
              borderRight: idx === 1 ? `4px solid ${team.color}` : undefined,
            }}
          >
            <p className="text-sm md:text-base font-medium text-white/70 uppercase tracking-wider mb-1">
              {team.name}
            </p>
            <p className="text-4xl md:text-6xl font-black text-white">
              <AnimatedScore score={team.score} />
            </p>
          </motion.div>
          {idx === 0 && roundPoints !== undefined && roundPoints > 0 && (
            <div className="flex flex-col items-center px-4">
              <p className="text-white/40 text-[10px] uppercase tracking-wider">Round Pot</p>
              <motion.p
                key={roundPoints}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                className="text-[var(--color-gold)] text-3xl md:text-4xl font-black"
              >
                {roundPoints}
              </motion.p>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
