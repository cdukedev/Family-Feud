'use client';

import { useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface BuzzResult {
  status: 'winner' | 'second';
  winner?: string;
  answer_window_seconds?: number;
}

export function useBuzzer() {
  const buzz = useCallback(
    async (roundId: string, playerId: string, teamId: string): Promise<BuzzResult> => {
      const supabase = createClient();

      const { data, error } = await supabase.functions.invoke('handle-buzz', {
        body: {
          round_id: roundId,
          player_id: playerId,
          team_id: teamId,
          client_ts: Date.now(),
        },
      });

      if (error) throw error;
      return data as BuzzResult;
    },
    [],
  );

  return { buzz };
}
