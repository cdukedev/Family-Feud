// Game status enum
export type GameStatus = 'lobby' | 'face_off' | 'main_round' | 'fast_money' | 'finished';

// Round phase enum
export type RoundPhase = 'face_off' | 'playing' | 'steal' | 'complete';

// Fast Money status
export type FastMoneyStatus = 'player1_playing' | 'player2_sequestered' | 'player2_playing' | 'reveal' | 'complete';

// Phone UI state — determines what the player sees on their phone
export type PhoneUIState =
  | 'lobby'
  | 'team_setup'
  | 'face_off_waiting'
  | 'face_off_buzzer'
  | 'face_off_answer'
  | 'play_or_pass'
  | 'your_turn'
  | 'waiting_for_teammate'
  | 'steal_huddle'
  | 'fast_money_sequester'
  | 'fast_money_active'
  | 'fast_money_reveal'
  | 'game_over';

// Interfaces for all database entities
export interface Player {
  id: string;
  auth_id: string;
  username: string;
  avatar_color: string | null;
  game_id: string | null;
  created_at: string;
}

export interface Game {
  id: string;
  room_code: string;
  host_player: string;
  status: GameStatus;
  current_round: number;
  settings: GameSettings;
  created_at: string;
}

export interface GameSettings {
  total_rounds: number;
  host_voice: string;
  include_custom_questions: boolean;
  answer_window_seconds: number;
}

export interface Team {
  id: string;
  game_id: string;
  name: string;
  color: string;
  score: number;
  player_order: string[];
  created_at: string;
}

export interface TeamMember {
  player_id: string;
  team_id: string;
  game_id: string;
}

export interface Question {
  id: string;
  text: string;
  answer_count: number;
  category: string | null;
  difficulty: string;
  source: 'archive' | 'generated' | 'custom';
  source_detail: string | null;
  fast_money_ok: boolean;
  times_used: number;
  tags: string[];
  created_at: string;
}

export interface Answer {
  id: string;
  question_id: string;
  rank: number;
  text: string;
  points: number;
  aliases: string[];
}

export interface Round {
  id: string;
  game_id: string;
  round_number: number;
  question_id: string;
  phase: RoundPhase;
  controlling_team: string | null;
  point_multiplier: number;
  strikes: number;
  revealed: number[];
  face_off_winner: string | null;
  face_off_answer1_rank: number | null;
  face_off_answer1_player: string | null;
  face_off_answer2_rank: number | null;
  face_off_answer2_player: string | null;
  face_off_pair_index: number;
  created_at: string;
}

export interface PlayerAnswer {
  id: string;
  round_id: string;
  player_id: string;
  team_id: string;
  raw_text: string;
  matched_rank: number | null;
  is_correct: boolean;
  is_steal: boolean;
  is_fast_money: boolean;
  phase: string;
  answered_at: string;
}

export interface FastMoney {
  id: string;
  game_id: string;
  player1_id: string;
  player2_id: string;
  questions: string[];
  player1_answers: FastMoneyAnswer[];
  player2_answers: FastMoneyAnswer[];
  player1_total: number;
  player2_total: number;
  combined_total: number;
  status: FastMoneyStatus;
  created_at: string;
}

export interface FastMoneyAnswer {
  question_id: string;
  raw_text: string;
  matched_rank: number | null;
  points: number;
}

export interface BuzzerEvent {
  id: string;
  round_id: string;
  player_id: string;
  team_id: string;
  buzzed_at: string;
  client_ts: number | null;
  answer_text: string | null;
  matched_rank: number | null;
  is_winner: boolean;
}

// Chat message for steal huddle
export interface ChatMessage {
  id: string;
  player_id: string;
  username: string;
  text: string;
  timestamp: string;
}

// Game state combining all related data
export interface GameState {
  game: Game | null;
  currentRound: Round | null;
  teams: Team[];
  players: Player[];
  teamMembers: TeamMember[];
  answers: Answer[];
  revealedAnswers: number[];
  buzzerArmed: boolean;
  currentTurnPlayer: string | null;
  fastMoney: FastMoney | null;
}
