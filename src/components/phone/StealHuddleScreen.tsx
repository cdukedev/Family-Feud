'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Timer } from '@/components/ui/Timer';
import { useGameStore } from '@/stores/gameStore';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';

interface StealHuddleScreenProps {
  roundId: string;
  questionId: string;
  playerId: string;
  teamId: string;
  isDesignatedStealer: boolean;
}

export function StealHuddleScreen({
  roundId,
  questionId,
  playerId,
  teamId,
  isDesignatedStealer,
}: StealHuddleScreenProps) {
  const [message, setMessage] = useState('');
  const [stealAnswer, setStealAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { chatMessages, addChatMessage, currentPlayer } = useGameStore();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendMessage = () => {
    if (!message.trim() || !currentPlayer) return;

    const msg = {
      id: crypto.randomUUID(),
      player_id: currentPlayer.id,
      username: currentPlayer.username,
      text: message.trim(),
      timestamp: new Date().toISOString(),
    };

    addChatMessage(msg);

    // Broadcast to team via Supabase Realtime
    const supabase = createClient();
    supabase.channel(`steal:${roundId}`).send({
      type: 'broadcast',
      event: 'chat',
      payload: msg,
    });

    setMessage('');
  };

  const submitSteal = async () => {
    if (!stealAnswer.trim() || submitted) return;
    setSubmitted(true);

    const supabase = createClient();
    await supabase.functions.invoke('judge-answer', {
      body: {
        round_id: roundId,
        question_id: questionId,
        player_id: playerId,
        team_id: teamId,
        raw_text: stealAnswer.trim(),
        phase: 'steal',
      },
    });
  };

  return (
    <div className="min-h-dvh flex flex-col p-4 bg-gradient-to-b from-[var(--color-dark)] to-[var(--color-board)]">
      <div className="text-center py-4">
        <p className="text-[var(--color-gold)] font-bold text-lg">STEAL OPPORTUNITY!</p>
        <Timer seconds={30} size="sm" className="mt-2" />
      </div>

      {/* Team chat */}
      <div className="flex-1 bg-white/5 rounded-xl p-3 overflow-y-auto max-h-[40vh] mb-4">
        {chatMessages.map((msg) => (
          <div key={msg.id} className="mb-2">
            <span className="text-[var(--color-gold)] text-xs font-medium">{msg.username}: </span>
            <span className="text-white text-sm">{msg.text}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Chat input */}
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Suggest an answer..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
          className="!py-2 !text-sm"
        />
        <Button variant="ghost" size="sm" onClick={sendMessage}>
          Send
        </Button>
      </div>

      {/* Steal answer (only for designated stealer) */}
      {isDesignatedStealer && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-white/10 pt-4 space-y-3"
        >
          <p className="text-[var(--color-primary)] font-bold text-center">
            You are the stealer!
          </p>
          <Input
            placeholder="Your steal answer..."
            value={stealAnswer}
            onChange={(e) => setStealAnswer(e.target.value)}
            className="text-center !text-lg"
          />
          <Button
            variant="primary"
            size="lg"
            onClick={submitSteal}
            disabled={!stealAnswer.trim() || submitted}
            className="w-full"
          >
            {submitted ? 'Submitted!' : 'Submit Steal Answer'}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
