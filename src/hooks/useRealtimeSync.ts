'use client';

import { useEffect, useRef, useId } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useGameStore } from '@/stores/gameStore';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeSync(gameId: string | null) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const instanceId = useId();
  const {
    setGame,
    setCurrentRound,
    updateTeam,
    addPlayer,
    addBuzzerEvent,
    setFastMoney,
    setIsConnected,
    setBuzzerArmed,
  } = useGameStore();

  useEffect(() => {
    if (!gameId) return;

    const supabase = createClient();

    // Clean up existing subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Use unique channel name to avoid "already subscribed" conflicts
    const channelName = `game:${gameId}:${instanceId}:${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      // Game state changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
            setGame(payload.new as any);
          }
        },
      )
      // Round changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rounds',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
            setCurrentRound(payload.new as any);
          }
        },
      )
      // Team score updates
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'teams',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
            updateTeam(payload.new as any);
          }
        },
      )
      // Buzzer events
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'buzzer_events',
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
            addBuzzerEvent(payload.new as any);
          }
        },
      )
      // Fast money updates
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fast_money',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
            setFastMoney(payload.new as any);
          }
        },
      )
      // Broadcast events (buzzer armed, turn notifications, etc.)
      .on('broadcast', { event: 'buzzer_armed' }, () => {
        setBuzzerArmed(true);
      })
      .on('broadcast', { event: 'buzzer_disarmed' }, () => {
        setBuzzerArmed(false);
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [gameId, setGame, setCurrentRound, updateTeam, addPlayer, addBuzzerEvent, setFastMoney, setIsConnected, setBuzzerArmed]);

  // Full state fetch for reconnection
  const fetchFullState = async () => {
    if (!gameId) return;
    const supabase = createClient();

    const [gameRes, roundsRes, teamsRes, playersRes, membersRes] = await Promise.all([
      supabase.from('games').select('*').eq('id', gameId).single(),
      supabase.from('rounds').select('*').eq('game_id', gameId).order('round_number', { ascending: false }).limit(1),
      supabase.from('teams').select('*').eq('game_id', gameId),
      supabase.from('players').select('*, team_members!inner(game_id)').eq('team_members.game_id', gameId),
      supabase.from('team_members').select('*').eq('game_id', gameId),
    ]);

    if (gameRes.data) useGameStore.getState().setGame(gameRes.data as any);
    if (roundsRes.data?.[0]) useGameStore.getState().setCurrentRound(roundsRes.data[0] as any);
    if (teamsRes.data) useGameStore.getState().setTeams(teamsRes.data as any);
    if (membersRes.data) useGameStore.getState().setTeamMembers(membersRes.data as any);
  };

  return { fetchFullState };
}
