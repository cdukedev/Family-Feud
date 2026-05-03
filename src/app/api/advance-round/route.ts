import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

function getServerPointMultiplier(roundNumber: number): number {
  if (roundNumber <= 2) return 1;
  if (roundNumber === 3) return 2;
  return 3;
}

export async function POST(request: Request) {
  try {
    const {
      game_id,
      round_id,
      action,
      controlling_team,
      override_type,
      player_id,
    } = await request.json();

    const supabase = createAdminClient();

    switch (action) {
      // ─── START GAME ───────────────────────────────────────────────
      case 'start_game': {
        if (!game_id) {
          return NextResponse.json({ error: 'game_id is required' }, { status: 400 });
        }

        // Select a random question with lowest times_used
        const { data: questions } = await supabase
          .from('questions')
          .select('id, times_used')
          .order('times_used', { ascending: true })
          .limit(20);

        if (!questions || questions.length === 0) {
          return NextResponse.json({ error: 'No questions available' }, { status: 500 });
        }

        const minUsed = questions[0].times_used;
        const candidates = questions.filter((q) => q.times_used === minUsed);
        const picked = candidates[Math.floor(Math.random() * candidates.length)];
        const questionId = picked.id;

        // Increment times_used
        await supabase
          .from('questions')
          .update({ times_used: picked.times_used + 1 })
          .eq('id', questionId);

        // Create the first round
        const { data: roundData, error: roundError } = await supabase
          .from('rounds')
          .insert({
            game_id,
            round_number: 1,
            question_id: questionId,
            phase: 'face_off',
            point_multiplier: 1,
          })
          .select();

        if (roundError || !roundData?.length) {
          return NextResponse.json({ error: roundError?.message || 'Failed to create round' }, { status: 500 });
        }
        const round = roundData[0];

        // Update game status
        const { error: gameError } = await supabase
          .from('games')
          .update({ status: 'face_off', current_round: 1 })
          .eq('id', game_id);

        if (gameError) {
          return NextResponse.json({ error: gameError.message }, { status: 500 });
        }

        return NextResponse.json({ round });
      }

      // ─── PLAY OR PASS ────────────────────────────────────────────
      case 'play_or_pass': {
        if (!round_id || !controlling_team) {
          return NextResponse.json(
            { error: 'round_id and controlling_team are required' },
            { status: 400 }
          );
        }

        const { data: updated, error: updateError } = await supabase
          .from('rounds')
          .update({ controlling_team, phase: 'playing' })
          .eq('id', round_id)
          .select();

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ round: updated?.[0] });
      }

      // ─── NEXT TURN ───────────────────────────────────────────────
      case 'next_turn': {
        if (!round_id) {
          return NextResponse.json({ error: 'round_id is required' }, { status: 400 });
        }

        // Placeholder — actual turn tracking is client-side for now
        return NextResponse.json({ success: true });
      }

      // ─── COMPLETE ROUND ───────────────────────────────────────────
      case 'complete_round': {
        if (!round_id) {
          return NextResponse.json({ error: 'round_id is required' }, { status: 400 });
        }

        // Fetch the round
        const { data: rounds } = await supabase
          .from('rounds')
          .select('id, game_id, round_number, question_id, revealed, point_multiplier, controlling_team')
          .eq('id', round_id)
          .limit(1);

        const round = rounds?.[0];
        if (!round) {
          return NextResponse.json({ error: 'Round not found' }, { status: 500 });
        }

        // Fetch answers for the question
        const { data: answers } = await supabase
          .from('answers')
          .select('rank, points')
          .eq('question_id', round.question_id);

        // Calculate total points from revealed answers
        const revealedRanks: number[] = round.revealed ?? [];
        const totalPoints = (answers ?? [])
          .filter((a) => revealedRanks.includes(a.rank))
          .reduce((sum, a) => sum + a.points * (round.point_multiplier ?? 1), 0);

        // Award points to the controlling team
        if (round.controlling_team && totalPoints > 0) {
          const { data: teamData } = await supabase
            .from('teams')
            .select('score')
            .eq('id', round.controlling_team)
            .limit(1);

          await supabase
            .from('teams')
            .update({ score: (teamData?.[0]?.score ?? 0) + totalPoints })
            .eq('id', round.controlling_team);
        }

        // Mark round as complete
        await supabase
          .from('rounds')
          .update({ phase: 'complete' })
          .eq('id', round_id);

        // Fetch both teams' current scores (needed for 300-pt check and tie check)
        const { data: allTeams } = await supabase
          .from('teams')
          .select('id, score, name')
          .eq('game_id', round.game_id);

        const maxScore = Math.max(...(allTeams || []).map((t) => t.score));

        // 300-point threshold — game won immediately
        if (maxScore >= 300) {
          const winner = allTeams?.find((t) => t.score === maxScore);
          await supabase.from('games').update({ status: 'fast_money' }).eq('id', round.game_id);
          return NextResponse.json({
            status: 'game_won',
            winner_team: winner?.id,
            winner_name: winner?.name,
            points_awarded: totalPoints,
            final_scores: allTeams,
          });
        }

        // Check if the game should finish
        const { data: gameData } = await supabase
          .from('games')
          .select('settings, id')
          .eq('id', round.game_id)
          .limit(1);

        const gameSettings = gameData?.[0]?.settings as any;
        const totalRounds = gameSettings?.total_rounds ?? 4;

        if (round.round_number >= totalRounds) {
          const scores = (allTeams || []).map((t) => t.score);

          if (scores.length >= 2 && scores[0] === scores[1]) {
            // SUDDEN DEATH — create triple-value round
            const { data: sdQuestions } = await supabase
              .from('questions')
              .select('id, times_used')
              .order('times_used', { ascending: true })
              .order('id', { ascending: true })
              .limit(20);

            if (!sdQuestions || sdQuestions.length === 0) {
              return NextResponse.json({ error: 'No questions available for sudden death' }, { status: 500 });
            }

            const sdMinUsed = sdQuestions[0].times_used;
            const sdCandidates = sdQuestions.filter((q) => q.times_used === sdMinUsed);
            const sdPicked = sdCandidates[Math.floor(Math.random() * sdCandidates.length)];

            await supabase
              .from('questions')
              .update({ times_used: sdPicked.times_used + 1 })
              .eq('id', sdPicked.id);

            const sdRoundNumber = round.round_number + 1;

            const { data: sdRoundData, error: sdRoundError } = await supabase
              .from('rounds')
              .insert({
                game_id: round.game_id,
                round_number: sdRoundNumber,
                question_id: sdPicked.id,
                phase: 'face_off',
                point_multiplier: 3,
              })
              .select();

            if (sdRoundError) {
              return NextResponse.json({ error: sdRoundError.message }, { status: 500 });
            }

            await supabase
              .from('games')
              .update({ status: 'face_off', current_round: sdRoundNumber })
              .eq('id', round.game_id);

            return NextResponse.json({
              status: 'sudden_death',
              points_awarded: totalPoints,
              round: sdRoundData?.[0],
              final_scores: allTeams,
            });
          }

          // Not tied — winner goes to fast money
          const winner = allTeams?.reduce((a, b) => (a.score > b.score ? a : b));
          await supabase.from('games').update({ status: 'fast_money' }).eq('id', round.game_id);
          return NextResponse.json({
            status: 'game_won',
            winner_team: winner?.id,
            winner_name: winner?.name,
            points_awarded: totalPoints,
            final_scores: allTeams,
          });
        }

        // Otherwise, create the next round with a new random question
        const nextRoundNumber = round.round_number + 1;

        // Pick a new question
        const { data: questions } = await supabase
          .from('questions')
          .select('id, times_used')
          .order('times_used', { ascending: true })
          .order('id', { ascending: true })
          .limit(20);

        if (!questions || questions.length === 0) {
          return NextResponse.json({ error: 'No questions available' }, { status: 500 });
        }

        const minUsed = questions[0].times_used;
        const candidates = questions.filter((q) => q.times_used === minUsed);
        const picked = candidates[Math.floor(Math.random() * candidates.length)];

        // Increment times_used for the new question
        await supabase
          .from('questions')
          .update({ times_used: picked.times_used + 1 })
          .eq('id', picked.id);

        // Determine point multiplier using absolute round numbers per TV rules
        const pointMultiplier = getServerPointMultiplier(nextRoundNumber);

        const { data: newRoundData, error: newRoundError } = await supabase
          .from('rounds')
          .insert({
            game_id: round.game_id,
            round_number: nextRoundNumber,
            question_id: picked.id,
            phase: 'face_off',
            point_multiplier: pointMultiplier,
          })
          .select();

        if (newRoundError) {
          return NextResponse.json({ error: newRoundError.message }, { status: 500 });
        }
        const newRound = newRoundData?.[0];

        // Update game current_round
        await supabase
          .from('games')
          .update({ status: 'face_off', current_round: nextRoundNumber })
          .eq('id', round.game_id);

        return NextResponse.json({
          status: 'next_round',
          points_awarded: totalPoints,
          round: newRound,
        });
      }

      // ─── HOST OVERRIDE ───────────────────────────────────────────
      case 'host_override': {
        if (!round_id || !override_type || !player_id) {
          return NextResponse.json(
            { error: 'round_id, override_type, and player_id are required' },
            { status: 400 }
          );
        }

        // Placeholder — return success
        return NextResponse.json({
          success: true,
          override_type,
          player_id,
        });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
