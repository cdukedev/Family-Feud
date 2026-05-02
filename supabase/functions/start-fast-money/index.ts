import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseClient } from "../_shared/supabase.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { game_id, player1_id, player2_id } = await req.json();
    const supabase = getSupabaseClient();

    // Get questions already used in this game's rounds
    const { data: usedRounds } = await supabase
      .from("rounds")
      .select("question_id")
      .eq("game_id", game_id);

    const usedQuestionIds = (usedRounds || []).map((r: any) => r.question_id);

    // Also get questions used in any existing fast_money for this game
    const { data: existingFM } = await supabase
      .from("fast_money")
      .select("question_ids")
      .eq("game_id", game_id);

    const fmUsedIds = (existingFM || []).flatMap((fm: any) => fm.question_ids || []);
    const allUsedIds = [...new Set([...usedQuestionIds, ...fmUsedIds])];

    // Select 5 random questions marked fast_money_ok=true that weren't used
    const { data: candidates, error: qError } = await supabase
      .from("questions")
      .select("*")
      .eq("fast_money_ok", true)
      .order("times_used", { ascending: true });

    if (qError) throw new Error(qError.message);
    if (!candidates || candidates.length === 0) {
      throw new Error("No fast money questions available");
    }

    // Filter out used questions
    let available = candidates.filter(
      (q: any) => !allUsedIds.includes(q.id)
    );

    // If not enough unused, fall back to all fast_money_ok questions
    if (available.length < 5) {
      available = candidates;
    }

    // Shuffle and pick 5
    const shuffled = available.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 5);

    if (selected.length < 5) {
      throw new Error(
        `Only ${selected.length} fast money questions available, need 5`
      );
    }

    const questionIds = selected.map((q: any) => q.id);

    // Increment times_used for selected questions
    for (const q of selected) {
      await supabase
        .from("questions")
        .update({ times_used: (q.times_used || 0) + 1 })
        .eq("id", q.id);
    }

    // Create fast_money row
    const { data: fastMoney, error: fmError } = await supabase
      .from("fast_money")
      .insert({
        game_id,
        player1_id,
        player2_id,
        question_ids: questionIds,
        player1_answers: [],
        player2_answers: [],
        player1_total: 0,
        player2_total: 0,
        status: "player1_playing",
      })
      .select()
      .single();

    if (fmError) throw new Error(fmError.message);

    // Update game status to fast_money
    await supabase
      .from("games")
      .update({ status: "fast_money", fast_money_id: fastMoney.id })
      .eq("id", game_id);

    return new Response(
      JSON.stringify({
        status: "fast_money_started",
        fast_money: fastMoney,
        questions: selected,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err) {
    console.error("start-fast-money error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
