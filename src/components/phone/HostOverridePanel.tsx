'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface HostOverridePanelProps {
  roundId: string;
  lastAnswerPlayerId: string | null;
  lastAnswerCorrect: boolean | null;
}

export function HostOverridePanel({
  roundId,
  lastAnswerPlayerId,
  lastAnswerCorrect,
}: HostOverridePanelProps) {
  const [show, setShow] = useState(true);

  if (!lastAnswerPlayerId || lastAnswerCorrect === null) return null;

  const handleOverride = async (action: 'accept' | 'reject') => {
    const supabase = createClient();
    await supabase.functions.invoke('advance-round', {
      body: {
        round_id: roundId,
        action: 'host_override',
        override_type: action,
        player_id: lastAnswerPlayerId,
      },
    });
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 left-4 right-4 bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 z-40"
        >
          <p className="text-xs text-white/60 mb-2 text-center">Host Override</p>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOverride('accept')}
              className="flex-1"
            >
              Force Accept
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleOverride('reject')}
              className="flex-1"
            >
              Force Reject
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShow(false)}
            >
              Dismiss
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
