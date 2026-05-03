'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { Scoreboard } from './Scoreboard';
import { Logo } from '@/components/ui/Logo';
import { useAudio } from '@/hooks/useAudio';
import { ConfettiOverlay } from './ConfettiOverlay';
import type { Team } from '@/types/game';

interface FastMoneyBoardProps {
  gameId: string;
  teams: Team[];
}

export function FastMoneyBoard({ gameId, teams }: FastMoneyBoardProps) {
  const { fastMoney, players } = useGameStore();
  const { play } = useAudio();
  const [revealIndex, setRevealIndex] = useState(-1);
  const [showTotal, setShowTotal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const celebratedRef = useRef(false);

  // Sequential reveal — advance every 4 seconds when revealing
  useEffect(() => {
    if (fastMoney?.status !== 'reveal') return;

    setRevealIndex(0); // Start with first answer

    const interval = setInterval(() => {
      setRevealIndex(prev => {
        const next = prev + 1;
        if (next >= 10) { // 5 questions × 2 players = 10 reveals
          clearInterval(interval);
        }
        return next;
      });
    }, 4000); // 4 seconds per reveal

    return () => clearInterval(interval);
  }, [fastMoney?.status]);

  useEffect(() => {
    if (fastMoney && fastMoney.combined_total >= 200 && !celebratedRef.current) {
      celebratedRef.current = true;
      play('confetti');
      play('applause');
      setShowConfetti(true);
    }
  }, [fastMoney?.combined_total, play]);

  const player1 = players.find((p) => p.id === fastMoney?.player1_id);
  const player2 = players.find((p) => p.id === fastMoney?.player2_id);

  const isRevealing = fastMoney?.status === 'reveal';
  const isComplete = fastMoney?.status === 'complete';

  if (!fastMoney) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--color-dark)]">
        <p className="text-white/60 text-xl animate-pulse">Setting up Fast Money...</p>
      </div>
    );
  }

  const p1Answers = fastMoney.player1_answers || [];
  const p2Answers = fastMoney.player2_answers || [];

  return (
    <div className="min-h-dvh flex flex-col bg-gradient-to-b from-[var(--color-dark)] via-[#0d1b2a] to-[var(--color-dark)] p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <Logo size="sm" />
        <div className="text-[var(--color-gold)] text-xl font-bold">FAST MONEY</div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_2fr_80px_2fr_80px] gap-2 max-w-4xl mx-auto w-full mb-4 px-4">
        <div />
        <div className="text-center text-white/60 font-medium">
          {player1?.username || 'Player 1'}
        </div>
        <div />
        <div className="text-center text-white/60 font-medium">
          {player2?.username || 'Player 2'}
        </div>
        <div />
      </div>

      {/* Answer rows */}
      <div className="flex-1 max-w-4xl mx-auto w-full space-y-3">
        {fastMoney.questions.map((_, idx) => {
          const p1 = p1Answers[idx];
          const p2 = p2Answers[idx];
          const showP1 = isComplete || (isRevealing && revealIndex >= idx * 2);
          const showP2 = isComplete || (isRevealing && revealIndex >= idx * 2 + 1);

          return (
            <div
              key={idx}
              className="grid grid-cols-[1fr_2fr_80px_2fr_80px] gap-2 items-center"
            >
              <div className="text-center text-white/40 font-bold">{idx + 1}</div>

              {/* Player 1 answer */}
              <div className="bg-white/5 rounded-lg px-4 py-3 text-center">
                {p1 && showP1 ? (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-white font-medium uppercase"
                  >
                    {p1.raw_text}
                  </motion.span>
                ) : p1 && !isRevealing && !isComplete ? (
                  <span className="text-white font-medium uppercase">
                    {fastMoney.status === 'player1_playing' ? 'LOCKED' : p1.raw_text}
                  </span>
                ) : (
                  <span className="text-white/20">---</span>
                )}
              </div>

              {/* Player 1 points */}
              <div className="text-center">
                {p1 && showP1 ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-[var(--color-gold)] font-black text-xl"
                  >
                    {p1.points}
                  </motion.span>
                ) : (
                  <span className="text-white/10">--</span>
                )}
              </div>

              {/* Player 2 answer */}
              <div className="bg-white/5 rounded-lg px-4 py-3 text-center">
                {p2 && showP2 ? (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-white font-medium uppercase"
                  >
                    {p2.raw_text}
                  </motion.span>
                ) : p2 && !isRevealing && !isComplete ? (
                  <span className="text-white font-medium uppercase">
                    {fastMoney.status === 'player2_playing' ? 'LOCKED' : p2.raw_text}
                  </span>
                ) : (
                  <span className="text-white/20">---</span>
                )}
              </div>

              {/* Player 2 points */}
              <div className="text-center">
                {p2 && showP2 ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-[var(--color-gold)] font-black text-xl"
                  >
                    {p2.points}
                  </motion.span>
                ) : (
                  <span className="text-white/10">--</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Running total */}
      <div className="mt-6 text-center">
        <p className="text-white/60 text-sm uppercase tracking-wider mb-1">Total</p>
        {(() => {
          let visibleTotal = fastMoney.combined_total;
          if (isRevealing && !isComplete) {
            visibleTotal = 0;
            for (let i = 0; i < 5; i++) {
              if (revealIndex >= i * 2 && p1Answers[i]) visibleTotal += p1Answers[i].points || 0;
              if (revealIndex >= i * 2 + 1 && p2Answers[i]) visibleTotal += p2Answers[i].points || 0;
            }
          }
          return (
            <motion.p
              key={visibleTotal}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className={`text-5xl md:text-7xl font-black ${
                visibleTotal >= 200
                  ? 'text-[var(--color-gold)] drop-shadow-[0_0_30px_rgba(255,215,0,0.6)]'
                  : 'text-white'
              }`}
            >
              {visibleTotal}
            </motion.p>
          );
        })()}

        <p className="text-white/40 text-sm mt-1">/ 200 points to win</p>
      </div>

      {/* Scoreboard */}
      <div className="mt-6">
        <Scoreboard teams={teams} />
      </div>

      <ConfettiOverlay active={showConfetti} />
    </div>
  );
}
