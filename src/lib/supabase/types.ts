export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      players: {
        Row: {
          id: string;
          auth_id: string;
          username: string;
          avatar_color: string | null;
          game_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          auth_id: string;
          username: string;
          avatar_color?: string | null;
          game_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          auth_id?: string;
          username?: string;
          avatar_color?: string | null;
          game_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      games: {
        Row: {
          id: string;
          room_code: string;
          host_player: string;
          status: string;
          current_round: number;
          settings: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_code: string;
          host_player: string;
          status?: string;
          current_round?: number;
          settings?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_code?: string;
          host_player?: string;
          status?: string;
          current_round?: number;
          settings?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      teams: {
        Row: {
          id: string;
          game_id: string;
          name: string;
          color: string;
          score: number;
          player_order: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          name: string;
          color: string;
          score?: number;
          player_order?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          name?: string;
          color?: string;
          score?: number;
          player_order?: string[];
          created_at?: string;
        };
        Relationships: [];
      };
      team_members: {
        Row: {
          player_id: string;
          team_id: string;
          game_id: string;
        };
        Insert: {
          player_id: string;
          team_id: string;
          game_id: string;
        };
        Update: {
          player_id?: string;
          team_id?: string;
          game_id?: string;
        };
        Relationships: [];
      };
      questions: {
        Row: {
          id: string;
          text: string;
          answer_count: number;
          category: string | null;
          difficulty: string;
          source: string;
          source_detail: string | null;
          fast_money_ok: boolean;
          times_used: number;
          tags: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          text: string;
          answer_count: number;
          category?: string | null;
          difficulty?: string;
          source?: string;
          source_detail?: string | null;
          fast_money_ok?: boolean;
          times_used?: number;
          tags?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          text?: string;
          answer_count?: number;
          category?: string | null;
          difficulty?: string;
          source?: string;
          source_detail?: string | null;
          fast_money_ok?: boolean;
          times_used?: number;
          tags?: string[];
          created_at?: string;
        };
        Relationships: [];
      };
      answers: {
        Row: {
          id: string;
          question_id: string;
          rank: number;
          text: string;
          points: number;
          aliases: string[];
        };
        Insert: {
          id?: string;
          question_id: string;
          rank: number;
          text: string;
          points: number;
          aliases?: string[];
        };
        Update: {
          id?: string;
          question_id?: string;
          rank?: number;
          text?: string;
          points?: number;
          aliases?: string[];
        };
        Relationships: [];
      };
      rounds: {
        Row: {
          id: string;
          game_id: string;
          round_number: number;
          question_id: string;
          phase: string;
          controlling_team: string | null;
          point_multiplier: number;
          strikes: number;
          revealed: number[];
          face_off_winner: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          round_number: number;
          question_id: string;
          phase?: string;
          controlling_team?: string | null;
          point_multiplier?: number;
          strikes?: number;
          revealed?: number[];
          face_off_winner?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          round_number?: number;
          question_id?: string;
          phase?: string;
          controlling_team?: string | null;
          point_multiplier?: number;
          strikes?: number;
          revealed?: number[];
          face_off_winner?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      player_answers: {
        Row: {
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
        };
        Insert: {
          id?: string;
          round_id: string;
          player_id: string;
          team_id: string;
          raw_text: string;
          matched_rank?: number | null;
          is_correct?: boolean;
          is_steal?: boolean;
          is_fast_money?: boolean;
          phase?: string;
          answered_at?: string;
        };
        Update: {
          id?: string;
          round_id?: string;
          player_id?: string;
          team_id?: string;
          raw_text?: string;
          matched_rank?: number | null;
          is_correct?: boolean;
          is_steal?: boolean;
          is_fast_money?: boolean;
          phase?: string;
          answered_at?: string;
        };
        Relationships: [];
      };
      fast_money: {
        Row: {
          id: string;
          game_id: string;
          player1_id: string;
          player2_id: string;
          questions: string[];
          player1_answers: Json;
          player2_answers: Json;
          player1_total: number;
          player2_total: number;
          combined_total: number;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          player1_id: string;
          player2_id: string;
          questions?: string[];
          player1_answers?: Json;
          player2_answers?: Json;
          player1_total?: number;
          player2_total?: number;
          combined_total?: number;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          player1_id?: string;
          player2_id?: string;
          questions?: string[];
          player1_answers?: Json;
          player2_answers?: Json;
          player1_total?: number;
          player2_total?: number;
          combined_total?: number;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      buzzer_events: {
        Row: {
          id: string;
          round_id: string;
          player_id: string;
          team_id: string;
          buzzed_at: string;
          client_ts: number | null;
          answer_text: string | null;
          matched_rank: number | null;
          is_winner: boolean;
        };
        Insert: {
          id?: string;
          round_id: string;
          player_id: string;
          team_id: string;
          buzzed_at?: string;
          client_ts?: number | null;
          answer_text?: string | null;
          matched_rank?: number | null;
          is_winner?: boolean;
        };
        Update: {
          id?: string;
          round_id?: string;
          player_id?: string;
          team_id?: string;
          buzzed_at?: string;
          client_ts?: number | null;
          answer_text?: string | null;
          matched_rank?: number | null;
          is_winner?: boolean;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
