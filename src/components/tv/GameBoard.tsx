'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnswerTile } from './AnswerTile';
import { StrikeOverlay } from './StrikeOverlay';
import { Scoreboard } from './Scoreboard';
import { FaceOffDisplay } from './FaceOffDisplay';
import { FastMoneyBoard } from './FastMoneyBoard';
import { GameOverScreen } from './GameOverScreen';
import { Logo } from '@/components/ui/Logo';
import { useGameStore } from '@/stores/gameStore';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { createClient } from '@/lib/supabase/client';
import { calculateRoundPoints } from '@/lib/game/scoring';
import type { Answer, Player, Question } from '@/types/game';
import { motion, AnimatePresence } from 'framer-motion';

interface GameBoardProps {
  gameId: string;
}

export function GameBoard({ gameId }: GameBoardProps) {
  const { game, currentRound, teams, players, teamMembers, answers, setAnswers } = useGameStore();
  const [question, setQuestion] = useState<Question | null>(null);
  const [showStrike, setShowStrike] = useState(false);
  const [lastStrikeCount, setLastStrikeCount] = useState(0);
  const { fetchFullState } = useRealtimeSync(gameId);

  // Fetch full state on mount
  useEffect(() => {
    fetchFullState();
  }, []);

  // Fetch question and answers when round changes
  useEffect(() => {
    if (!currentRound?.question_id) return;

    const supabase = createClient();
    async function fetchQuestion() {
      const [qRes, aRes] = await Promise.all([
        supabase
          .from('questions')
          .select('*')
          .eq('id', currentRound!.question_id)
          .single(),
        supabase
          .from('answers')
          .select('*')
          .eq('question_id', currentRound!.question_id)
          .order('rank'),
      ]);

      if (qRes.data) setQuestion(qRes.data as Question);
      if (aRes.data) setAnswers(aRes.data as Answer[]);
    }
    fetchQuestion();
  }, [currentRound?.question_id, setAnswers]);

  // Show strike overlay when strikes increase
  useEffect(() => {
    if (currentRound && currentRound.strikes > lastStrikeCount) {
      setShowStrike(true);
      setLastStrikeCount(currentRound.strikes);
    }
  }, [currentRound?.strikes, lastStrikeCount]);

  const dismissStrike = useCallback(() => setShowStrike(false), []);

  // Get face-off players
  const getFaceOffPlayers = (): { player1: Player; player2: Player } | null => {
    if (teams.length < 2 || !currentRound) return null;
    const idx = (currentRound.round_number - 1) % Math.max(teams[0].player_order.length, 1);
    const p1Id = teams[0].player_order[idx];
    const p2Id = teams[1].player_order[idx];
    const p1 = players.find((p) => p.id === p1Id);
    const p2 = players.find((p) => p.id === p2Id);
    if (!p1 || !p2) return null;
    return { player1: p1, player2: p2 };
  };

  const roundPoints = currentRound && answers.length > 0
    ? calculateRoundPoints(currentRound.revealed, answers, currentRound.round_number)
    : 0;

  // Game over
  if (game?.status === 'finished') {
    return <GameOverScreen teams={teams} />;
  }

  // Fast money
  if (game?.status === 'fast_money') {
    return <FastMoneyBoard gameId={gameId} teams={teams} />;
  }

  // Waiting for round to be created
  if (!currentRound) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-[var(--color-dark)] via-[#0d1b2a] to-[var(--color-dark)] p-8">
        <Logo size="lg" className="mb-8" />
        <motion.p
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-white/60 text-2xl"
        >
          Starting the game...
        </motion.p>
        {teams.length >= 2 && (
          <div className="mt-8">
            <Scoreboard teams={teams} />
          </div>
        )}
      </div>
    );
  }

  const faceOffPlayers = getFaceOffPlayers();

  return (
    <div className="min-h-dvh flex flex-col bg-gradient-to-b from-[var(--color-dark)] via-[#0d1b2a] to-[var(--color-dark)] p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Logo size="sm" />
        {currentRound && (
          <div className="text-white/60 text-sm md:text-base">
            Round {currentRound.round_number}
            {currentRound.point_multiplier > 1 && (
              <span className="text-[var(--color-gold)] ml-2 font-bold">
                {currentRound.point_multiplier}x POINTS
              </span>
            )}
          </div>
        )}
      </div>

      {/* Question */}
      {question && (
        <motion.div
          key={question.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <p className="text-xl md:text-3xl font-bold text-white max-w-3xl mx-auto leading-relaxed">
            {question.text}
          </p>
        </motion.div>
      )}

      {/* Face-Off Display */}
      {currentRound?.phase === 'face_off' && faceOffPlayers && (
        <FaceOffDisplay
          player1={faceOffPlayers.player1}
          player2={faceOffPlayers.player2}
          team1Color={teams[0]?.color || '#E63946'}
          team2Color={teams[1]?.color || '#457B9D'}
          winnerId={currentRound.face_off_winner}
          phase={currentRound.face_off_winner ? 'answering' : 'buzzing'}
        />
      )}

      {/* Answer Board */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-2xl space-y-2 md:space-y-3">
          <AnimatePresence>
            {answers.map((answer) => (
              <motion.div
                key={answer.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (answer.rank - 1) * 0.1 }}
              >
                <AnswerTile
                  rank={answer.rank}
                  text={answer.text}
                  points={answer.points}
                  revealed={currentRound?.revealed.includes(answer.rank) || false}
                  multiplier={currentRound?.point_multiplier || 1}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Strike indicators */}
      {currentRound && currentRound.strikes > 0 && (
        <div className="flex justify-center gap-3 my-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                i < currentRound.strikes
                  ? 'bg-[var(--color-danger)] border-[var(--color-danger)] shadow-[0_0_10px_rgba(231,76,60,0.5)]'
                  : 'bg-transparent border-white/20'
              }`}
            >
              {i < currentRound.strikes && (
                <svg viewBox="0 0 24 24" className="w-full h-full p-1">
                  <path d="M6 6l12 12M18 6L6 18" stroke="white" strokeWidth="3" strokeLinecap="round" />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Scoreboard */}
      <div className="mt-auto pt-4">
        <Scoreboard
          teams={teams}
          roundPoints={roundPoints}
          controllingTeamId={currentRound?.controlling_team}
        />
      </div>

      {/* Strike Overlay */}
      <StrikeOverlay
        strikes={currentRound?.strikes || 0}
        showLatest={showStrike}
        onDismiss={dismissStrike}
      />
    </div>
  );
}
