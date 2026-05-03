import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalize, soundex } from '@/lib/game/normalize-server';

export async function POST(request: Request) {
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
    } = await request.json();

    const supabase = createAdminClient();

    // 1. Fetch all answers for this question, ordered by rank
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select('*')
      .eq('question_id', question_id)
      .order('rank');

    if (answersError) {
      return NextResponse.json({ error: answersError.message }, { status: 500 });
    }

    // 2. Fetch the question text for Gemini prompt
    const { data: questionData } = await supabase
      .from('questions')
      .select('text')
      .eq('id', question_id)
      .limit(1);

    const questionText = questionData?.[0]?.text || '';

    // 3. If round_id is provided, fetch revealed ranks
    let revealed: number[] = [];
    if (round_id) {
      const { data: roundData } = await supabase
        .from('rounds')
        .select('revealed, strikes')
        .eq('id', round_id)
        .limit(1);

      revealed = roundData?.[0]?.revealed || [];
    }

    const normalizedInput = normalize(raw_text);
    let matchedAnswer: (typeof answers)[number] | null = null;
    let matchTier: string | null = null;

    // --- Tier 1: Exact Match ---
    for (const answer of answers) {
      if (revealed.includes(answer.rank)) continue;

      const normalizedCanonical = normalize(answer.text);
      if (normalizedCanonical === normalizedInput) {
        matchedAnswer = answer;
        matchTier = 'exact';
        break;
      }

      const aliases: string[] = answer.aliases || [];
      for (const alias of aliases) {
        if (normalize(alias) === normalizedInput) {
          matchedAnswer = answer;
          matchTier = 'exact';
          break;
        }
      }
      if (matchedAnswer) break;
    }

    // --- Tier 2: Phonetic Match ---
    if (!matchedAnswer) {
      const inputSoundex = soundex(raw_text);
      for (const answer of answers) {
        if (revealed.includes(answer.rank)) continue;

        if (soundex(answer.text) === inputSoundex) {
          matchedAnswer = answer;
          matchTier = 'phonetic';
          break;
        }

        const aliases: string[] = answer.aliases || [];
        for (const alias of aliases) {
          if (soundex(alias) === inputSoundex) {
            matchedAnswer = answer;
            matchTier = 'phonetic';
            break;
          }
        }
        if (matchedAnswer) break;
      }
    }

    // --- Tier 3: Gemini Semantic Match ---
    if (!matchedAnswer) {
      const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
      if (GEMINI_API_KEY) {
        const unrevealed = answers.filter((a) => !revealed.includes(a.rank));
        const answerTexts = unrevealed.map((a) => `"${a.text}"`).join(', ');

        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: `You are a Family Feud answer judge. Question: "${questionText}". Board answers: [${answerTexts}]. Player said: "${raw_text}". If the player's answer matches any board answer, respond with ONLY the exact board answer text. Otherwise respond with exactly "NO MATCH". Be generous - Family Feud accepts reasonable interpretations.`,
                    },
                  ],
                },
              ],
              generationConfig: { temperature: 0.0, maxOutputTokens: 50 },
            }),
          }
        );

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          const geminiText =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

          if (geminiText && geminiText !== 'NO MATCH') {
            const normalizedGemini = normalize(geminiText);
            for (const answer of unrevealed) {
              if (normalize(answer.text) === normalizedGemini) {
                matchedAnswer = answer;
                matchTier = 'semantic';
                break;
              }
            }
          }
        }
      }
    }

    // --- After matching ---

    // Fast Money Player 2 duplicate check — compare against Player 1's answers
    if (fast_money_id && is_player1 === false && matchedAnswer) {
      const { data: fmCheck } = await supabase
        .from('fast_money')
        .select('player1_answers')
        .eq('id', fast_money_id)
        .limit(1);

      const p1Answers = (fmCheck?.[0]?.player1_answers as any[]) || [];
      // Check if Player 1 matched the same answer for this question
      if (question_index !== undefined) {
        const p1Answer = p1Answers[question_index];
        if (p1Answer && p1Answer.matched_rank === matchedAnswer.rank) {
          return NextResponse.json({
            is_correct: false,
            is_duplicate_of_player1: true,
            message: 'Try again!',
          });
          // Note: NO strike, NO player_answers record — just "Try again!"
          // The player gets to answer again within their time limit
        }
      }
    }

    // Check if matched answer is already revealed (duplicate)
    if (matchedAnswer && revealed.includes(matchedAnswer.rank)) {
      // Record the duplicate attempt as incorrect
      await supabase.from('player_answers').insert({
        round_id,
        player_id,
        team_id,
        raw_text,
        matched_rank: matchedAnswer.rank,
        is_correct: false,
        phase,
      });

      // Duplicates count as strikes in regular rounds (not fast_money)
      if (round_id && !fast_money_id) {
        const { data: roundData } = await supabase
          .from('rounds')
          .select('strikes')
          .eq('id', round_id)
          .limit(1);

        const currentStrikes = roundData?.[0]?.strikes ?? 0;
        await supabase
          .from('rounds')
          .update({ strikes: currentStrikes + 1 })
          .eq('id', round_id);
      }

      return NextResponse.json({
        is_correct: false,
        is_duplicate: true,
        message: 'Already on the board — counts as a strike!',
      });
    }

    if (matchedAnswer) {
      const matchedRank = matchedAnswer.rank;
      const matchedText = matchedAnswer.text;
      const points = matchedAnswer.points;

      // Insert into player_answers
      await supabase.from('player_answers').insert({
        round_id,
        player_id,
        team_id,
        raw_text,
        matched_rank: matchedRank,
        is_correct: true,
        phase,
      });

      if (fast_money_id) {
        // Fast money: update the appropriate player's answers array
        const { data: fmData } = await supabase
          .from('fast_money')
          .select('player1_answers, player2_answers')
          .eq('id', fast_money_id)
          .limit(1);

        const fm = fmData?.[0];
        const newEntry = { question_id, raw_text, matched_rank: matchedRank, points };
        if (is_player1) {
          const current = (fm?.player1_answers as any[]) || [];
          await supabase
            .from('fast_money')
            .update({ player1_answers: [...current, newEntry] as any })
            .eq('id', fast_money_id);
        } else {
          const current = (fm?.player2_answers as any[]) || [];
          await supabase
            .from('fast_money')
            .update({ player2_answers: [...current, newEntry] as any })
            .eq('id', fast_money_id);
        }
      } else if (round_id) {
        // Regular round: update revealed array
        const { data: round } = await supabase
          .from('rounds')
          .select('revealed, strikes')
          .eq('id', round_id)
          .limit(1);

        const currentRevealed = round?.[0]?.revealed || [];
        await supabase
          .from('rounds')
          .update({ revealed: [...currentRevealed, matchedRank] })
          .eq('id', round_id);
      }

      return NextResponse.json({
        is_correct: true,
        matched_rank: matchedRank,
        matched_text: matchedText,
        points,
      });
    } else {
      // No match
      await supabase.from('player_answers').insert({
        round_id,
        player_id,
        team_id,
        raw_text,
        matched_rank: null,
        is_correct: false,
        phase,
      });

      if (fast_money_id) {
        const { data: fmData } = await supabase
          .from('fast_money')
          .select('player1_answers, player2_answers')
          .eq('id', fast_money_id)
          .limit(1);

        const fm = fmData?.[0];
        const newEntry = { question_id, raw_text, matched_rank: null, points: 0 };
        if (is_player1) {
          const current = (fm?.player1_answers as any[]) || [];
          await supabase
            .from('fast_money')
            .update({ player1_answers: [...current, newEntry] as any })
            .eq('id', fast_money_id);
        } else {
          const current = (fm?.player2_answers as any[]) || [];
          await supabase
            .from('fast_money')
            .update({ player2_answers: [...current, newEntry] as any })
            .eq('id', fast_money_id);
        }
      } else if (round_id) {
        // Increment strikes
        const { data: round } = await supabase
          .from('rounds')
          .select('revealed, strikes')
          .eq('id', round_id)
          .limit(1);

        const currentStrikes = round?.[0]?.strikes || 0;
        await supabase
          .from('rounds')
          .update({ strikes: currentStrikes + 1 })
          .eq('id', round_id);
      }

      return NextResponse.json({ is_correct: false });
    }
  } catch (error) {
    console.error('judge-answer error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
