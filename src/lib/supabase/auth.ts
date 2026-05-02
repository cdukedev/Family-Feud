import { createClient } from './client';

export async function signInAnonymously() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data;
}

export async function getSession() {
  const supabase = createClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

export async function createPlayer(username: string, avatarColor: string, gameId?: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('players')
    .insert({
      auth_id: user.id,
      username,
      avatar_color: avatarColor,
      ...(gameId ? { game_id: gameId } : {}),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPlayerByAuthId() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('players')
    .select('*')
    .eq('auth_id', user.id)
    .single();

  return data;
}

export async function joinGame(playerId: string, roomCode: string) {
  const supabase = createClient();

  // Find game by room code
  const { data: games } = await supabase
    .from('games')
    .select('*')
    .eq('room_code', roomCode.toUpperCase())
    .eq('status', 'lobby')
    .limit(1);

  if (!games?.length) throw new Error('Game not found or already started');
  const game = games[0];

  // Associate player with this game
  await supabase
    .from('players')
    .update({ game_id: game.id })
    .eq('id', playerId);

  return game;
}

export async function createGame(hostPlayerId: string, roomCode: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('games')
    .insert({
      room_code: roomCode,
      host_player: hostPlayerId,
      status: 'lobby',
      current_round: 0,
      settings: {
        total_rounds: 4,
        host_voice: 'en-US-Neural2-D',
        include_custom_questions: true,
        answer_window_seconds: 10,
      },
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
