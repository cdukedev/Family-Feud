import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseClient } from "../_shared/supabase.ts";
import { normalize, soundex } from "../_shared/normalize.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      round_id,
      question_id,
      player_id,
      team_id,
      raw_text,
      phase,
      fast_money_id,
      question_index,
      is_player1,
    } = await req.json();

    const supabase = getSupabaseClient();

    // Fetch all answers for the question
    const { data: answers, error: answersError } = await supabase
      .from("answers")
      .select("*")
      .eq("question_id", question_id)
      .order("rank", { ascending: true });

    if (answersError) throw new Error(answersError.message);

    // Fetch current round data (revealed answers)
    const { data: round, error: roundError } = await supabase
      .from("rounds")
      .select("*")
      .eq("id", round_id)
      .single();

    if (roundError) throw new Error(roundError.message);

    const revealedRanks: number[] = round.revealed || [];

    // Try to match the answer
    const matchResult = await matchAnswer(raw_text, answers, round.question_id);

    // Check for duplicates
    if (matchResult.matched && revealedRanks.includes(matchResult.matchedAnswer.rank)) {
      // Insert player answer as incorrect (duplicate)
      await supabase.from("player_answers").insert({
        round_id,
        player_id,
        team_id,
        raw_text,
        is_correct: false,
        matched_answer_id: matchResult.matchedAnswer.id,
        match_method: matchResult.method,
      });

      return new Response(
        JSON.stringify({
          is_correct: false,
          is_duplicate: true,
          matched_text: matchResult.matchedAnswer.text,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (matchResult.matched) {
      const matchedAnswer = matchResult.matchedAnswer;

      // Insert player answer as correct
      await supabase.from("player_answers").insert({
        round_id,
        player_id,
        team_id,
        raw_text,
        is_correct: true,
        matched_answer_id: matchedAnswer.id,
        match_method: matchResult.method,
      });

      // Update rounds.revealed to include the new rank
      const newRevealed = [...revealedRanks, matchedAnswer.rank];
      await supabase
        .from("rounds")
        .update({ revealed: newRevealed })
        .eq("id", round_id);

      // Handle fast money phase
      if (phase === "fast_money" && fast_money_id) {
        await updateFastMoney(
          supabase,
          fast_money_id,
          question_index,
          is_player1,
          raw_text,
          matchedAnswer.text,
          matchedAnswer.points,
          true
        );
      }

      return new Response(
        JSON.stringify({
          is_correct: true,
          matched_rank: matchedAnswer.rank,
          matched_text: matchedAnswer.text,
          points: matchedAnswer.points,
          method: matchResult.method,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      // No match found
      await supabase.from("player_answers").insert({
        round_id,
        player_id,
        team_id,
        raw_text,
        is_correct: false,
        match_method: "none",
      });

      // Increment strikes
      const newStrikes = (round.strikes || 0) + 1;
      await supabase
        .from("rounds")
        .update({ strikes: newStrikes })
        .eq("id", round_id);

      // Handle fast money phase
      if (phase === "fast_money" && fast_money_id) {
        await updateFastMoney(
          supabase,
          fast_money_id,
          question_index,
          is_player1,
          raw_text,
          null,
          0,
          false
        );
      }

      return new Response(
        JSON.stringify({
          is_correct: false,
          strikes: newStrikes,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
  } catch (err) {
    console.error("judge-answer error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

interface MatchResult {
  matched: boolean;
  matchedAnswer?: any;
  method?: string;
}

/**
 * Attempt to match a player's answer against the board answers using three tiers.
 */
async function matchAnswer(
  rawText: string,
  answers: any[],
  questionId: string
): Promise<MatchResult> {
  const normalizedInput = normalize(rawText);

  // Tier 1: Exact normalized match against canonical text and aliases
  for (const answer of answers) {
    const normalizedCanonical = normalize(answer.text);
    if (normalizedInput === normalizedCanonical) {
      return { matched: true, matchedAnswer: answer, method: "exact" };
    }

    // Check aliases
    const aliases: string[] = answer.aliases || [];
    for (const alias of aliases) {
      if (normalizedInput === normalize(alias)) {
        return { matched: true, matchedAnswer: answer, method: "alias" };
      }
    }
  }

  // Tier 2: Soundex phonetic matching
  const inputSoundex = soundex(normalizedInput);
  for (const answer of answers) {
    if (inputSoundex === soundex(normalize(answer.text))) {
      return { matched: true, matchedAnswer: answer, method: "soundex" };
    }

    const aliases: string[] = answer.aliases || [];
    for (const alias of aliases) {
      if (inputSoundex === soundex(normalize(alias))) {
        return { matched: true, matchedAnswer: answer, method: "soundex_alias" };
      }
    }
  }

  // Tier 3: Gemini Flash semantic matching
  try {
    const geminiMatch = await callGemini(rawText, answers, questionId);
    if (geminiMatch) {
      // Find the matched answer by text
      const normalizedGemini = normalize(geminiMatch);
      for (const answer of answers) {
        if (
          normalize(answer.text) === normalizedGemini ||
          normalizedGemini.includes(normalize(answer.text)) ||
          normalize(answer.text).includes(normalizedGemini)
        ) {
          return { matched: true, matchedAnswer: answer, method: "gemini" };
        }
        // Also try exact match on original text
        if (answer.text.toLowerCase().trim() === geminiMatch.toLowerCase().trim()) {
          return { matched: true, matchedAnswer: answer, method: "gemini" };
        }
      }
    }
  } catch (err) {
    console.error("Gemini matching failed, treating as no match:", err);
  }

  return { matched: false };
}

/**
 * Call Gemini Flash for semantic answer matching.
 */
async function callGemini(
  playerAnswer: string,
  answers: any[],
  questionId: string
): Promise<string | null> {
  const boardAnswers = answers.map((a) => a.text).join(", ");

  // We need the question text - fetch it
  const supabase = getSupabaseClient();
  const { data: question } = await supabase
    .from("questions")
    .select("text")
    .eq("id", questionId)
    .single();

  const questionText = question?.text || "Unknown question";

  const prompt = `You are a Family Feud answer judge. Given a survey question, the list of correct board answers, and a player's spoken answer, determine if the player's answer matches any board answer. Respond with ONLY the exact text of the matching board answer, or 'NO MATCH' if there is no match. Be generous - Family Feud accepts reasonable interpretations.

Survey Question: ${questionText}
Board Answers: ${boardAnswers}
Player's Answer: ${playerAnswer}`;

  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.0,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!text || text === "NO MATCH") {
    return null;
  }

  return text;
}

/**
 * Update fast_money table with answer results.
 */
async function updateFastMoney(
  supabase: ReturnType<typeof getSupabaseClient>,
  fastMoneyId: string,
  questionIndex: number,
  isPlayer1: boolean,
  rawText: string,
  matchedText: string | null,
  points: number,
  isCorrect: boolean
) {
  // Fetch current fast_money row
  const { data: fastMoney, error } = await supabase
    .from("fast_money")
    .select("*")
    .eq("id", fastMoneyId)
    .single();

  if (error) {
    console.error("Error fetching fast_money:", error);
    return;
  }

  const field = isPlayer1 ? "player1_answers" : "player2_answers";
  const currentAnswers = fastMoney[field] || [];

  // Update the answer at the question index
  currentAnswers[questionIndex] = {
    raw_text: rawText,
    matched_text: matchedText,
    points,
    is_correct: isCorrect,
  };

  await supabase
    .from("fast_money")
    .update({ [field]: currentAnswers })
    .eq("id", fastMoneyId);
}
