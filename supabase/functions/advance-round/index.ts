import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseClient } from "../_shared/supabase.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { round_id, action, controlling_team, override_type, player_id } =
      await req.json();

    const supabase = getSupabaseClient();

    switch (action) {
      case "start_game":
        return await handleStartGame(supabase, round_id);
      case "play_or_pass":
        return await handlePlayOrPass(supabase, round_id, controlling_team);
      case "next_turn":
        return await handleNextTurn(supabase, round_id);
      case "complete_round":
        return await handleCompleteRound(supabase, round_id);
      case "host_override":
        return await handleHostOverride(supabase, round_id, override_type, player_id);
      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
    }
  } catch (err) {
    console.error("advance-round error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

/**
 * Get point multiplier based on round number.
 * Rounds 1-2: 1x, Round 3: 2x, Round 4+: 3x
 */
function getMultiplier(roundNumber: number): number {
  if (roundNumber <= 2) return 1;
  if (roundNumber === 3) return 2;
  return 3;
}

/**
 * Select a random question that hasn't been used yet (or least used).
 */
async function selectRandomQuestion(
  supabase: ReturnType<typeof getSupabaseClient>,
  gameId: string,
  fastMoneyOnly = false
) {
  // Get questions already used in this game
  const { data: usedRounds } = await supabase
    .from("rounds")
    .select("question_id")
    .eq("game_id", gameId);

  const usedQuestionIds = (usedRounds || []).map((r: any) => r.question_id);

  // Build query for questions
  let query = supabase
    .from("questions")
    .select("*")
    .order("times_used", { ascending: true });

  if (fastMoneyOnly) {
    query = query.eq("fast_money_ok", true);
  }

  const { data: questions, error } = await query;

  if (error) throw new Error(error.message);
  if (!questions || questions.length === 0) throw new Error("No questions available");

  // Prefer questions not used in this game
  const unusedInGame = questions.filter(
    (q: any) => !usedQuestionIds.includes(q.id)
  );

  const pool = unusedInGame.length > 0 ? unusedInGame : questions;

  // Among the pool, pick from those with the lowest times_used
  const minUsed = pool[0].times_used || 0;
  const leastUsed = pool.filter((q: any) => (q.times_used || 0) === minUsed);

  const selected = leastUsed[Math.floor(Math.random() * leastUsed.length)];

  // Increment times_used
  await supabase
    .from("questions")
    .update({ times_used: (selected.times_used || 0) + 1 })
    .eq("id", selected.id);

  return selected;
}

/**
 * Start a new game: create the first round with a random question.
 */
async function handleStartGame(
  supabase: ReturnType<typeof getSupabaseClient>,
  gameId: string
) {
  const question = await selectRandomQuestion(supabase, gameId);

  const { data: round, error: roundError } = await supabase
    .from("rounds")
    .insert({
      game_id: gameId,
      round_number: 1,
      question_id: question.id,
      phase: "face_off",
      revealed: [],
      strikes: 0,
      multiplier: 1,
    })
    .select()
    .single();

  if (roundError) throw new Error(roundError.message);

  // Update game status
  await supabase
    .from("games")
    .update({ status: "playing", current_round_id: round.id })
    .eq("id", gameId);

  return jsonResponse({
    status: "game_started",
    round,
    question,
  });
}

/**
 * Handle play or pass decision after face-off.
 */
async function handlePlayOrPass(
  supabase: ReturnType<typeof getSupabaseClient>,
  roundId: string,
  controllingTeam: string
) {
  // Fetch the round
  const { data: round, error } = await supabase
    .from("rounds")
    .select("*")
    .eq("id", roundId)
    .single();

  if (error) throw new Error(error.message);

  // Fetch the controlling team's player order
  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", controllingTeam)
    .single();

  if (!team) throw new Error("Team not found");

  const playerOrder: string[] = team.player_order || [];

  // Find the face-off player in the order and set next player
  // The face-off player already answered, so start with the next one
  const faceOffBuzz = await supabase
    .from("buzzes")
    .select("player_id")
    .eq("round_id", roundId)
    .eq("team_id", controllingTeam)
    .eq("is_winner", true)
    .maybeSingle();

  let currentTurnIndex = 0;
  if (faceOffBuzz?.data?.player_id) {
    const buzzIdx = playerOrder.indexOf(faceOffBuzz.data.player_id);
    if (buzzIdx >= 0) {
      currentTurnIndex = (buzzIdx + 1) % playerOrder.length;
    }
  }

  const { data: updatedRound, error: updateError } = await supabase
    .from("rounds")
    .update({
      controlling_team: controllingTeam,
      phase: "playing",
      current_turn_player: playerOrder[currentTurnIndex],
      current_turn_index: currentTurnIndex,
    })
    .eq("id", roundId)
    .select()
    .single();

  if (updateError) throw new Error(updateError.message);

  return jsonResponse({
    status: "playing",
    round: updatedRound,
    current_player: playerOrder[currentTurnIndex],
  });
}

/**
 * Advance to the next player's turn.
 */
async function handleNextTurn(
  supabase: ReturnType<typeof getSupabaseClient>,
  roundId: string
) {
  const { data: round, error } = await supabase
    .from("rounds")
    .select("*")
    .eq("id", roundId)
    .single();

  if (error) throw new Error(error.message);

  // Get total answers for this question
  const { data: answers } = await supabase
    .from("answers")
    .select("id")
    .eq("question_id", round.question_id);

  const totalAnswers = answers?.length || 0;
  const revealedCount = (round.revealed || []).length;

  // Check if all answers are revealed
  if (revealedCount >= totalAnswers) {
    // All answers revealed - complete the round
    const { data: updatedRound } = await supabase
      .from("rounds")
      .update({ phase: "round_complete" })
      .eq("id", roundId)
      .select()
      .single();

    return jsonResponse({
      status: "all_revealed",
      round: updatedRound,
    });
  }

  // Check if 3 strikes - transition to steal phase
  if ((round.strikes || 0) >= 3) {
    const { data: updatedRound } = await supabase
      .from("rounds")
      .update({ phase: "steal" })
      .eq("id", roundId)
      .select()
      .single();

    return jsonResponse({
      status: "steal_phase",
      round: updatedRound,
    });
  }

  // Advance to next player in controlling team's player_order
  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", round.controlling_team)
    .single();

  if (!team) throw new Error("Controlling team not found");

  const playerOrder: string[] = team.player_order || [];
  const currentIndex = round.current_turn_index || 0;
  const nextIndex = (currentIndex + 1) % playerOrder.length;

  const { data: updatedRound } = await supabase
    .from("rounds")
    .update({
      current_turn_player: playerOrder[nextIndex],
      current_turn_index: nextIndex,
    })
    .eq("id", roundId)
    .select()
    .single();

  return jsonResponse({
    status: "next_turn",
    round: updatedRound,
    current_player: playerOrder[nextIndex],
  });
}

/**
 * Complete the round: award points, create next round or transition to fast money.
 */
async function handleCompleteRound(
  supabase: ReturnType<typeof getSupabaseClient>,
  roundId: string
) {
  const { data: round, error } = await supabase
    .from("rounds")
    .select("*")
    .eq("id", roundId)
    .single();

  if (error) throw new Error(error.message);

  // Calculate total points from revealed answers
  const { data: answers } = await supabase
    .from("answers")
    .select("*")
    .eq("question_id", round.question_id);

  const revealedRanks: number[] = round.revealed || [];
  const multiplier = getMultiplier(round.round_number);

  let totalPoints = 0;
  for (const answer of answers || []) {
    if (revealedRanks.includes(answer.rank)) {
      totalPoints += answer.points;
    }
  }
  totalPoints *= multiplier;

  // Determine winning team (controlling team if they didn't strike out,
  // or the stealing team if they did)
  const winningTeamId = round.winning_team || round.controlling_team;

  // Update team score
  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", winningTeamId)
    .single();

  if (team) {
    await supabase
      .from("teams")
      .update({ score: (team.score || 0) + totalPoints })
      .eq("id", winningTeamId);
  }

  // Mark round as complete
  await supabase
    .from("rounds")
    .update({
      phase: "round_complete",
      points_awarded: totalPoints,
      winning_team: winningTeamId,
    })
    .eq("id", roundId);

  // Fetch game to decide what's next
  const { data: game } = await supabase
    .from("games")
    .select("*")
    .eq("id", round.game_id)
    .single();

  if (!game) throw new Error("Game not found");

  // Check if we should go to fast money (e.g., after round 4 or configurable)
  const maxRounds = game.settings?.max_rounds || 4;

  if (round.round_number >= maxRounds) {
    // Transition to fast money
    await supabase
      .from("games")
      .update({ status: "fast_money_pending" })
      .eq("id", game.id);

    return jsonResponse({
      status: "fast_money_pending",
      points_awarded: totalPoints,
      winning_team: winningTeamId,
    });
  }

  // Create next round
  const nextRoundNumber = round.round_number + 1;
  const nextQuestion = await selectRandomQuestion(supabase, game.id);

  const { data: nextRound, error: nextRoundError } = await supabase
    .from("rounds")
    .insert({
      game_id: game.id,
      round_number: nextRoundNumber,
      question_id: nextQuestion.id,
      phase: "face_off",
      revealed: [],
      strikes: 0,
      multiplier: getMultiplier(nextRoundNumber),
    })
    .select()
    .single();

  if (nextRoundError) throw new Error(nextRoundError.message);

  await supabase
    .from("games")
    .update({ current_round_id: nextRound.id })
    .eq("id", game.id);

  return jsonResponse({
    status: "next_round",
    points_awarded: totalPoints,
    winning_team: winningTeamId,
    next_round: nextRound,
    next_question: nextQuestion,
  });
}

/**
 * Host override: force accept or reject an answer.
 */
async function handleHostOverride(
  supabase: ReturnType<typeof getSupabaseClient>,
  roundId: string,
  overrideType: string,
  playerId: string
) {
  const { data: round, error } = await supabase
    .from("rounds")
    .select("*")
    .eq("id", roundId)
    .single();

  if (error) throw new Error(error.message);

  if (overrideType === "accept") {
    // Host is force-accepting an answer that was judged incorrect.
    // We need to know which answer to accept - get the last player_answer
    const { data: lastAnswer } = await supabase
      .from("player_answers")
      .select("*")
      .eq("round_id", roundId)
      .eq("player_id", playerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!lastAnswer) throw new Error("No answer found to override");

    // If a matched_answer_id exists, reveal that answer
    if (lastAnswer.matched_answer_id) {
      const { data: answer } = await supabase
        .from("answers")
        .select("*")
        .eq("id", lastAnswer.matched_answer_id)
        .single();

      if (answer) {
        const newRevealed = [...(round.revealed || []), answer.rank];
        await supabase
          .from("rounds")
          .update({ revealed: newRevealed })
          .eq("id", roundId);
      }
    }

    // Mark the player answer as correct
    await supabase
      .from("player_answers")
      .update({ is_correct: true, match_method: "host_override" })
      .eq("id", lastAnswer.id);

    // Decrement strikes if one was added for this answer
    if (!lastAnswer.is_correct) {
      const newStrikes = Math.max(0, (round.strikes || 0) - 1);
      await supabase
        .from("rounds")
        .update({ strikes: newStrikes })
        .eq("id", roundId);
    }

    return jsonResponse({ status: "override_accepted" });
  } else if (overrideType === "reject") {
    // Host is force-rejecting an answer that was judged correct
    const { data: lastAnswer } = await supabase
      .from("player_answers")
      .select("*")
      .eq("round_id", roundId)
      .eq("player_id", playerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!lastAnswer) throw new Error("No answer found to override");

    // Remove the answer's rank from revealed
    if (lastAnswer.matched_answer_id) {
      const { data: answer } = await supabase
        .from("answers")
        .select("*")
        .eq("id", lastAnswer.matched_answer_id)
        .single();

      if (answer) {
        const newRevealed = (round.revealed || []).filter(
          (r: number) => r !== answer.rank
        );
        await supabase
          .from("rounds")
          .update({ revealed: newRevealed })
          .eq("id", roundId);
      }
    }

    // Mark the player answer as incorrect
    await supabase
      .from("player_answers")
      .update({ is_correct: false, match_method: "host_override_reject" })
      .eq("id", lastAnswer.id);

    // Increment strikes
    const newStrikes = (round.strikes || 0) + 1;
    await supabase
      .from("rounds")
      .update({ strikes: newStrikes })
      .eq("id", roundId);

    return jsonResponse({ status: "override_rejected", strikes: newStrikes });
  }

  return jsonResponse({ error: "Unknown override_type" }, 400);
}
