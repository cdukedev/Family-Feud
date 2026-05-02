import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseClient } from "../_shared/supabase.ts";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { round_id, player_id, team_id, client_ts } = await req.json();
    const server_ts = new Date().toISOString();
    const supabase = getSupabaseClient();

    // Use advisory lock on round_id hash to prevent race conditions.
    // We run the entire check-and-insert inside a Postgres transaction via rpc
    // or raw SQL. Since Supabase Edge Functions don't have direct transaction
    // support, we use a single rpc call with pg_advisory_xact_lock.
    const { data, error } = await supabase.rpc("handle_buzz_atomic", {
      p_round_id: round_id,
      p_player_id: player_id,
      p_team_id: team_id,
      p_client_ts: client_ts,
      p_server_ts: server_ts,
    });

    if (error) {
      // Fallback: if the RPC doesn't exist, do it in application layer
      // with optimistic locking
      console.warn("RPC handle_buzz_atomic not found, using fallback:", error.message);
      return await handleBuzzFallback(supabase, round_id, player_id, team_id, client_ts, server_ts);
    }

    // Broadcast buzzer_winner event via Realtime
    if (data?.status === "winner") {
      const channel = supabase.channel(`round:${round_id}`);
      await channel.send({
        type: "broadcast",
        event: "buzzer_winner",
        payload: {
          round_id,
          player_id,
          team_id,
          server_ts,
        },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("handle-buzz error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

/**
 * Fallback buzz handler when the atomic RPC is not available.
 * Uses application-level check with a small race window.
 */
async function handleBuzzFallback(
  supabase: ReturnType<typeof getSupabaseClient>,
  round_id: string,
  player_id: string,
  team_id: string,
  client_ts: string,
  server_ts: string
) {
  // Check if someone already buzzed and won this round
  const { data: existingWinner, error: checkError } = await supabase
    .from("buzzes")
    .select("*")
    .eq("round_id", round_id)
    .eq("is_winner", true)
    .maybeSingle();

  if (checkError) {
    return new Response(
      JSON.stringify({ error: checkError.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }

  if (!existingWinner) {
    // No winner yet - this player wins the buzz
    const { error: insertError } = await supabase.from("buzzes").insert({
      round_id,
      player_id,
      team_id,
      client_ts,
      server_ts,
      is_winner: true,
    });

    if (insertError) {
      return new Response(
        JSON.stringify({ error: insertError.message }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Broadcast buzzer_winner event
    const channel = supabase.channel(`round:${round_id}`);
    await channel.send({
      type: "broadcast",
      event: "buzzer_winner",
      payload: {
        round_id,
        player_id,
        team_id,
        server_ts,
      },
    });

    return new Response(
      JSON.stringify({ status: "winner", answer_window_seconds: 10 }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } else {
    // Winner already exists - this player is second
    const { error: insertError } = await supabase.from("buzzes").insert({
      round_id,
      player_id,
      team_id,
      client_ts,
      server_ts,
      is_winner: false,
    });

    if (insertError) {
      return new Response(
        JSON.stringify({ error: insertError.message }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    return new Response(
      JSON.stringify({ status: "second", winner: existingWinner.player_id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
}
