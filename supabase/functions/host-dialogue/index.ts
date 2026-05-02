import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HOST_PERSONALITY = `You are the host of Family Feud. You are enthusiastic, quick-witted, and love dramatic pauses. You call players by their actual usernames. You react with excitement to correct answers ("Good answer! Good answer!"), sympathy to strikes ("Ohhh, that's a strike!"), and build suspense during reveals. You keep the game moving briskly. You occasionally crack family-friendly jokes. You reference what happened earlier in the game when relevant. You never break character. You follow television Family Feud pacing — fast during regular play, slow and dramatic during reveals.

IMPORTANT: Keep your responses short and punchy. 1-3 sentences max for most game events. Only go longer for dramatic moments like Fast Money reveals.

Return ONLY the dialogue text. No stage directions, no asterisks, no descriptions of actions.`;

interface DialogueRequest {
  game_id: string;
  event_type: string;
  context: Record<string, any>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { game_id, event_type, context }: DialogueRequest = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Build prompt based on event type
    let userPrompt = "";

    switch (event_type) {
      case "game_start":
        userPrompt = `The game is starting! Team "${context.team1_name}" vs Team "${context.team2_name}". Welcome the families and get them hyped!`;
        break;

      case "face_off_intro":
        userPrompt = `Face-Off time! ${context.player1_name} from ${context.team1_name} vs ${context.player2_name} from ${context.team2_name}. Announce them!`;
        break;

      case "read_question":
        userPrompt = `Read this survey question to the players: "${context.question_text}". There are ${context.answer_count} answers on the board. Say "We surveyed 100 people..." then read the question.`;
        break;

      case "correct_answer":
        userPrompt = `${context.player_name} said "${context.answer_text}" and it's the #${context.rank} answer worth ${context.points} points! React with excitement!`;
        break;

      case "wrong_answer":
        userPrompt = `${context.player_name} said "${context.answer_text}" but it's not on the board! That's strike ${context.strikes} for the team. React with sympathy.`;
        break;

      case "duplicate_answer":
        userPrompt = `${context.player_name} said "${context.answer_text}" but that's already on the board! Tell them to try again.`;
        break;

      case "steal_opportunity":
        userPrompt = `Three strikes for ${context.controlling_team}! Now ${context.stealing_team} has a chance to steal ${context.points} points! Build the tension!`;
        break;

      case "steal_success":
        userPrompt = `${context.stealing_team} steals ${context.points} points with "${context.answer_text}"! Go wild!`;
        break;

      case "steal_fail":
        userPrompt = `${context.stealing_team} didn't get it! ${context.controlling_team} keeps the ${context.points} points. Reveal the remaining answers.`;
        break;

      case "round_complete":
        userPrompt = `Round ${context.round_number} is over! ${context.winning_team} wins ${context.points} points. Score: ${context.team1_name} ${context.team1_score}, ${context.team2_name} ${context.team2_score}.`;
        break;

      case "fast_money_intro":
        userPrompt = `It's time for FAST MONEY! ${context.player1_name} is up first with 20 seconds. ${context.player2_name} is sequestered. They need 200 points to win it all!`;
        break;

      case "fast_money_reveal":
        userPrompt = `Revealing Fast Money answers! For "${context.question_text}", ${context.player_name} said "${context.answer_text}"... Survey says... ${context.points} points! Running total: ${context.total}/${context.target}. ${context.total >= context.target ? "THEY'VE DONE IT! THEY WIN!" : ""}`;
        break;

      case "game_over":
        userPrompt = `The game is over! ${context.winner_name} wins with ${context.winner_score} points! Congratulate them!`;
        break;

      default:
        userPrompt = `Acknowledge what just happened in the game and keep things moving. Context: ${JSON.stringify(context)}`;
    }

    // Call Gemini API
    const apiKey = Deno.env.get("GEMINI_API_KEY")!;
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: userPrompt }],
            },
          ],
          systemInstruction: {
            parts: [{ text: HOST_PERSONALITY }],
          },
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 256,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const err = await geminiResponse.text();
      throw new Error(`Gemini API error: ${err}`);
    }

    const geminiData = await geminiResponse.json();
    const dialogue =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return new Response(
      JSON.stringify({ dialogue, event_type }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
