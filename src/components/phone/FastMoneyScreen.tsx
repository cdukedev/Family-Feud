'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Timer } from '@/components/ui/Timer';
import { useGameStore } from '@/stores/gameStore';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';

interface FastMoneyScreenProps {
  playerId: string;
  isPlayer1: boolean;
}

export function FastMoneyScreen({ playerId, isPlayer1 }: FastMoneyScreenProps) {
  const { fastMoney } = useGameStore();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const timeLimit = isPlayer1 ? 20 : 25;

  if (!fastMoney) return null;

  const submitAnswer = async () => {
    if (!answer.trim() || submitting) return;
    setSubmitting(true);

    try {
      const supabase = createClient();
      await supabase.functions.invoke('judge-answer', {
        body: {
          round_id: null,
          question_id: fastMoney.questions[currentQuestionIndex],
          player_id: playerId,
          team_id: null,
          raw_text: answer.trim(),
          phase: 'fast_money',
          fast_money_id: fastMoney.id,
          question_index: currentQuestionIndex,
          is_player1: isPlayer1,
        },
      });

      setAnswer('');
      setCurrentQuestionIndex((prev) => prev + 1);
    } catch (err) {
      console.error('Fast money answer failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTimeout = () => {
    // Submit whatever we have, move to next
    if (answer.trim()) {
      submitAnswer();
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  if (currentQuestionIndex >= 5) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-[var(--color-dark)]">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <p className="text-[var(--color-gold)] text-3xl font-bold mb-2">Done!</p>
          <p className="text-white/60">Watch the TV for the reveal!</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[var(--color-dark)] to-[#1a0000]">
      <div className="text-center mb-4">
        <p className="text-[var(--color-gold)] font-bold text-sm uppercase tracking-wider">
          Fast Money - Question {currentQuestionIndex + 1} of 5
        </p>
      </div>

      <Timer seconds={timeLimit} onComplete={handleTimeout} size="lg" className="mb-8" />

      <p className="text-white/40 text-sm mb-6">
        First thing that comes to mind!
      </p>

      <div className="w-full max-w-sm space-y-4">
        <Input
          placeholder="Your answer..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submitAnswer(); }}
          className="text-center !text-xl"
          autoFocus
        />

        <Button
          variant="primary"
          size="lg"
          onClick={submitAnswer}
          disabled={!answer.trim() || submitting}
          className="w-full"
        >
          LOCK IN!
        </Button>
      </div>
    </div>
  );
}
