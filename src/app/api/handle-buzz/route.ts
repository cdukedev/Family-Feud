import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { round_id, player_id, team_id, client_ts } = await request.json();

    const supabase = createAdminClient();
    const serverTs = new Date().toISOString();

    // Check if a winner already exists for this round
    const { data: existing, error: fetchError } = await supabase
      .from('buzzer_events')
      .select('*')
      .eq('round_id', round_id)
      .eq('is_winner', true)
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!existing) {
      // This player is the winner
      const { error: insertError } = await supabase
        .from('buzzer_events')
        .insert({
          round_id,
          player_id,
          team_id,
          client_ts,
          buzzed_at: serverTs,
          is_winner: true,
        });

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      // Update the round's face_off_winner
      await supabase
        .from('rounds')
        .update({ face_off_winner: player_id })
        .eq('id', round_id);

      // Broadcast buzzer_winner event to the game's Realtime channel
      const { data: roundData } = await supabase
        .from('rounds')
        .select('game_id')
        .eq('id', round_id)
        .limit(1);

      const round = roundData?.[0];
      if (round) {
        await supabase.channel(`game:${round.game_id}`).send({
          type: 'broadcast',
          event: 'buzzer_winner',
          payload: { player_id, team_id, round_id, server_ts: serverTs },
        });
      }

      return NextResponse.json({
        status: 'winner',
        answer_window_seconds: 10,
      });
    } else {
      // Winner already exists — this player is second
      const { error: insertError } = await supabase
        .from('buzzer_events')
        .insert({
          round_id,
          player_id,
          team_id,
          client_ts,
          buzzed_at: serverTs,
          is_winner: false,
        });

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      return NextResponse.json({
        status: 'second',
        winner: existing.player_id,
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
