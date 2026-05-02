import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalize, soundex } from '@/lib/game/normalize-server';

export async function POST(request: Request) {
  try {
    const { game_id, player1_id, player2_id } = await request.json();

    const supabase = createAdminClient();

    // 1. Get questions already used in this game
    const { data: usedRounds, error: usedError } = await supabase
      .from('rounds')
      .select('question_id')
      .eq('game_id', game_id);

    if (usedError) {
      return NextResponse.json({ error: usedError.message }, { status: 500 });
    }

    const usedIds = (usedRounds || []).map((r) => r.question_id);

    // 2. Select 5 random fast-money-eligible questions not already used
    let query = supabase
      .from('questions')
      .select('id')
      .eq('fast_money_ok', true)
      .order('random()')
      .limit(5);

    if (usedIds.length > 0) {
      query = query.not('id', 'in', `(${usedIds.join(',')})`);
    }

    const { data: questions, error: questionsError } = await query;

    if (questionsError) {
      return NextResponse.json({ error: questionsError.message }, { status: 500 });
    }

    if (!questions || questions.length < 5) {
      return NextResponse.json(
        { error: 'Not enough fast money questions available' },
        { status: 400 }
      );
    }

    const questionIds = questions.map((q) => q.id);

    // 3. Create fast_money row
    const { data: fastMoney, error: fmError } = await supabase
      .from('fast_money')
      .insert({
        game_id,
        player1_id,
        player2_id,
        questions: questionIds,
        player1_answers: [],
        player2_answers: [],
      })
      .select();

    if (fmError || !fastMoney?.length) {
      return NextResponse.json({ error: fmError?.message || 'Failed to create fast money' }, { status: 500 });
    }

    // 4. Update game status to fast_money
    const { error: gameError } = await supabase
      .from('games')
      .update({ status: 'fast_money' })
      .eq('id', game_id);

    if (gameError) {
      return NextResponse.json({ error: gameError.message }, { status: 500 });
    }

    return NextResponse.json(fastMoney);
  } catch (error) {
    console.error('start-fast-money error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
