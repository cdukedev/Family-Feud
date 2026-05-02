import { NextResponse } from 'next/server';

const HOST_PERSONALITY = `You are the host of Family Feud. You are enthusiastic, quick-witted, and love dramatic pauses. You call players by their actual usernames. You react with excitement to correct answers ("Good answer! Good answer!"), sympathy to strikes ("Ohhh, that's a strike!"), and build suspense during reveals. Keep responses short and punchy — 1-3 sentences max. Return ONLY dialogue text, no stage directions.`;

export async function POST(request: Request) {
  try {
    const { event_type, context } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Return a canned response when Gemini isn't configured
      const fallback: Record<string, string> = {
        game_start: "Welcome to Family Feud! Let's play!",
        face_off_intro: `It's Face-Off time! ${context?.player1_name || 'Player 1'} versus ${context?.player2_name || 'Player 2'}!`,
        read_question: `We surveyed 100 people! ${context?.question_text || ''}`,
        correct_answer: `Good answer! ${context?.answer_text || ''} is on the board!`,
        wrong_answer: "Ohhh, that's a strike!",
        steal_opportunity: "Can you steal?!",
        round_complete: "End of the round!",
        game_over: "Great game everyone!",
      };
      return NextResponse.json({
        dialogue: fallback[event_type] || "Let's keep playing!",
        event_type,
      });
    }

    let userPrompt = '';
    switch (event_type) {
      case 'game_start':
        userPrompt = `The game is starting! Team "${context.team1_name}" vs Team "${context.team2_name}". Welcome the families!`;
        break;
      case 'face_off_intro':
        userPrompt = `Face-Off time! ${context.player1_name} vs ${context.player2_name}. Announce them!`;
        break;
      case 'read_question':
        userPrompt = `Read this question: "${context.question_text}". ${context.answer_count} answers on the board.`;
        break;
      case 'correct_answer':
        userPrompt = `${context.player_name} said "${context.answer_text}" — #${context.rank} answer, ${context.points} points! React!`;
        break;
      case 'wrong_answer':
        userPrompt = `${context.player_name} said "${context.answer_text}" — not on the board! Strike ${context.strikes}!`;
        break;
      case 'round_complete':
        userPrompt = `Round ${context.round_number} over! ${context.winning_team} wins ${context.points} points.`;
        break;
      case 'game_over':
        userPrompt = `Game over! ${context.winner_name} wins with ${context.winner_score} points!`;
        break;
      default:
        userPrompt = `Acknowledge what happened: ${JSON.stringify(context)}`;
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: HOST_PERSONALITY }] },
          generationConfig: { temperature: 0.8, maxOutputTokens: 256 },
        }),
      },
    );

    if (!geminiResponse.ok) {
      const err = await geminiResponse.text();
      throw new Error(`Gemini API error: ${err}`);
    }

    const geminiData = await geminiResponse.json();
    const dialogue = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return NextResponse.json({ dialogue, event_type });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
