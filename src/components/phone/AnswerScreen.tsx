'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Timer } from '@/components/ui/Timer';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';

interface AnswerScreenProps {
  roundId: string;
  questionId: string;
  playerId: string;
  teamId: string;
  timeLimit: number;
  phase: string;
  onAnswered?: () => void;
}

export function AnswerScreen({
  roundId,
  questionId,
  playerId,
  teamId,
  timeLimit,
  phase,
  onAnswered,
}: AnswerScreenProps) {
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ is_correct: boolean; matched_text?: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submitAnswer = async (text: string) => {
    if (!text.trim() || submitting || submitted) return;

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke('judge-answer', {
        body: {
          round_id: roundId,
          question_id: questionId,
          player_id: playerId,
          team_id: teamId,
          raw_text: text.trim(),
          phase,
        },
      });

      if (error) throw error;

      setResult(data);
      setSubmitted(true);
      onAnswered?.();
    } catch (err) {
      console.error('Submit failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTimeout = () => {
    if (!submitted) {
      submitAnswer(answer || '(no answer)');
    }
  };

  if (submitted && result) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-[var(--color-dark)]">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10 }}
          className="text-center"
        >
          {result.is_correct ? (
            <>
              <div className="text-6xl mb-4">&#10003;</div>
              <p className="text-[var(--color-success)] text-2xl font-bold">Correct!</p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4 text-[var(--color-danger)]">X</div>
              <p className="text-[var(--color-danger)] text-2xl font-bold">Not on the board</p>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[var(--color-dark)] to-[var(--color-board)]">
      <Timer
        seconds={timeLimit}
        onComplete={handleTimeout}
        size="lg"
        className="mb-8"
      />

      <p className="text-white/60 text-lg mb-6 text-center">
        Say your answer!
      </p>

      {/* Text input fallback */}
      <div className="w-full max-w-sm space-y-4">
        <Input
          ref={inputRef}
          placeholder="Type your answer..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitAnswer(answer);
          }}
          className="text-center !text-xl"
        />

        <Button
          variant="primary"
          size="lg"
          onClick={() => submitAnswer(answer)}
          disabled={!answer.trim() || submitting}
          className="w-full"
        >
          {submitting ? 'Checking...' : 'Submit Answer'}
        </Button>
      </div>

      {/* Mic button placeholder — Phase 3 will add real STT */}
      <div className="mt-8">
        <Button
          variant="mic"
          size="xl"
          disabled
          className="!rounded-full !w-20 !h-20 opacity-30"
        >
          &#x1F3A4;
        </Button>
        <p className="text-white/20 text-xs text-center mt-2">Voice input coming soon</p>
      </div>
    </div>
  );
}
