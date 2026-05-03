import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { round_id, player_id, team_id, client_ts } = await request.json();

    const supabase = createAdminClient();
    const serverTs = new Date().toISOString();

    // Check how many buzzer events already exist for this round
    const { data: existingBuzzes, error: fetchError } = await supabase
      .from('buzzer_events')
      .select('*')
      .eq('round_id', round_id)
      .order('buzzed_at');

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const buzzCount = existingBuzzes?.length || 0;

    // Prevent duplicate buzzes from the same player
    if (existingBuzzes?.some((b) => b.player_id === player_id)) {
      return NextResponse.json({ status: 'already_buzzed' });
    }

    if (buzzCount === 0) {
      // First buzzer — record but do NOT set face_off_winner
      const { error: insertError } = await supabase
        .from('buzzer_events')
        .insert({
          round_id,
          player_id,
          team_id,
          client_ts,
          buzzed_at: serverTs,
          is_winner: false, // Winner not yet determined
        });

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      // Broadcast buzzer event for UI updates
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
          payload: { player_id, team_id, round_id, server_ts: serverTs, answer_order: 1 },
        });
      }

      return NextResponse.json({
        status: 'first_buzzer',
        answer_order: 1,
      });
    } else {
      // Second buzzer — record but do NOT set face_off_winner
      const { error: insertError } = await supabase
        .from('buzzer_events')
        .insert({
          round_id,
          player_id,
          team_id,
          client_ts,
          buzzed_at: serverTs,
          is_winner: false, // Winner not yet determined
        });

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      // Broadcast second buzzer event for UI updates
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
          payload: { player_id, team_id, round_id, server_ts: serverTs, answer_order: 2 },
        });
      }

      return NextResponse.json({
        status: 'second_buzzer',
        answer_order: 2,
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
