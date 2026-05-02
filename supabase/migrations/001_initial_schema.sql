-- ============================================================
-- Family Feud - Initial Schema Migration
-- ============================================================

-- ===================
-- TABLES
-- ===================

-- Players
CREATE TABLE players (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id    uuid NOT NULL UNIQUE,
  username   text NOT NULL,
  avatar_color text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Games
CREATE TABLE games (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code     text NOT NULL UNIQUE,
  host_player   uuid NOT NULL REFERENCES players(id),
  status        text NOT NULL DEFAULT 'lobby',
  current_round integer NOT NULL DEFAULT 0,
  settings      jsonb NOT NULL DEFAULT '{"total_rounds": 4, "host_voice": "default", "include_custom_questions": false, "answer_window_seconds": 15}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Teams
CREATE TABLE teams (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id      uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  name         text NOT NULL,
  color        text NOT NULL,
  score        integer NOT NULL DEFAULT 0,
  player_order uuid[] NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Team Members
CREATE TABLE team_members (
  player_id uuid NOT NULL REFERENCES players(id),
  team_id   uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  game_id   uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  PRIMARY KEY (player_id, game_id)
);

-- Questions
CREATE TABLE questions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text          text NOT NULL,
  answer_count  integer NOT NULL,
  category      text,
  difficulty    text NOT NULL DEFAULT 'medium',
  source        text NOT NULL DEFAULT 'archive',
  source_detail text,
  fast_money_ok boolean NOT NULL DEFAULT false,
  times_used    integer NOT NULL DEFAULT 0,
  tags          text[] NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Answers
CREATE TABLE answers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  rank        integer NOT NULL,
  text        text NOT NULL,
  points      integer NOT NULL,
  aliases     text[] NOT NULL DEFAULT '{}'
);

-- Rounds
CREATE TABLE rounds (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id          uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  round_number     integer NOT NULL,
  question_id      uuid NOT NULL REFERENCES questions(id),
  phase            text NOT NULL DEFAULT 'face_off',
  controlling_team uuid REFERENCES teams(id),
  point_multiplier integer NOT NULL DEFAULT 1,
  strikes          integer NOT NULL DEFAULT 0,
  revealed         integer[] NOT NULL DEFAULT '{}',
  face_off_winner  uuid REFERENCES players(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (game_id, round_number)
);

-- Player Answers
CREATE TABLE player_answers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id     uuid NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  player_id    uuid NOT NULL REFERENCES players(id),
  team_id      uuid NOT NULL REFERENCES teams(id),
  raw_text     text NOT NULL,
  matched_rank integer,
  is_correct   boolean NOT NULL DEFAULT false,
  is_steal     boolean NOT NULL DEFAULT false,
  is_fast_money boolean NOT NULL DEFAULT false,
  phase        text NOT NULL DEFAULT 'playing',
  answered_at  timestamptz NOT NULL DEFAULT now()
);

-- Fast Money
CREATE TABLE fast_money (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id         uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE UNIQUE,
  player1_id      uuid NOT NULL REFERENCES players(id),
  player2_id      uuid NOT NULL REFERENCES players(id),
  questions       uuid[] NOT NULL DEFAULT '{}',
  player1_answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  player2_answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  player1_total   integer NOT NULL DEFAULT 0,
  player2_total   integer NOT NULL DEFAULT 0,
  combined_total  integer NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'player1_playing',
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Buzzer Events
CREATE TABLE buzzer_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id    uuid NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  player_id   uuid NOT NULL REFERENCES players(id),
  team_id     uuid NOT NULL REFERENCES teams(id),
  buzzed_at   timestamptz NOT NULL DEFAULT now(),
  client_ts   bigint,
  answer_text text,
  matched_rank integer,
  is_winner   boolean NOT NULL DEFAULT false
);

-- ===================
-- INDEXES
-- ===================

CREATE INDEX idx_games_room_code ON games(room_code);
CREATE INDEX idx_team_members_game_id ON team_members(game_id);
CREATE INDEX idx_rounds_game_id ON rounds(game_id);
CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_player_answers_round_id ON player_answers(round_id);
CREATE INDEX idx_buzzer_events_round_id ON buzzer_events(round_id);

-- ===================
-- ENABLE RLS
-- ===================

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fast_money ENABLE ROW LEVEL SECURITY;
ALTER TABLE buzzer_events ENABLE ROW LEVEL SECURITY;

-- ===================
-- RLS POLICIES
-- ===================

-- Players: users can read their own record and insert their own
CREATE POLICY "Players can read own record"
  ON players FOR SELECT
  USING (auth_id = auth.uid());

CREATE POLICY "Players can insert own record"
  ON players FOR INSERT
  WITH CHECK (auth_id = auth.uid());

CREATE POLICY "Players can update own record"
  ON players FOR UPDATE
  USING (auth_id = auth.uid());

-- Games: members of the game can read, host can update
CREATE POLICY "Game members can read game"
  ON games FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN players p ON p.id = tm.player_id
      WHERE tm.game_id = games.id
        AND p.auth_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = games.host_player
        AND p.auth_id = auth.uid()
    )
  );

CREATE POLICY "Host can update game"
  ON games FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = games.host_player
        AND p.auth_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create games"
  ON games FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = games.host_player
        AND p.auth_id = auth.uid()
    )
  );

-- Teams: game members can read
CREATE POLICY "Game members can read teams"
  ON teams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN players p ON p.id = tm.player_id
      WHERE tm.game_id = teams.game_id
        AND p.auth_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM games g
      JOIN players p ON p.id = g.host_player
      WHERE g.id = teams.game_id
        AND p.auth_id = auth.uid()
    )
  );

CREATE POLICY "Host can manage teams"
  ON teams FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN players p ON p.id = g.host_player
      WHERE g.id = teams.game_id
        AND p.auth_id = auth.uid()
    )
  );

-- Team Members: game members can read, players can join
CREATE POLICY "Game members can read team members"
  ON team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = team_members.player_id
        AND p.auth_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM team_members tm2
      JOIN players p ON p.id = tm2.player_id
      WHERE tm2.game_id = team_members.game_id
        AND p.auth_id = auth.uid()
    )
  );

CREATE POLICY "Players can join teams"
  ON team_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = team_members.player_id
        AND p.auth_id = auth.uid()
    )
  );

-- Questions: readable by all authenticated users
CREATE POLICY "Authenticated users can read questions"
  ON questions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Answers: game members can read answers for their game's questions
CREATE POLICY "Authenticated users can read answers"
  ON answers FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Rounds: game members can read
CREATE POLICY "Game members can read rounds"
  ON rounds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN players p ON p.id = tm.player_id
      WHERE tm.game_id = rounds.game_id
        AND p.auth_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM games g
      JOIN players p ON p.id = g.host_player
      WHERE g.id = rounds.game_id
        AND p.auth_id = auth.uid()
    )
  );

CREATE POLICY "Host can manage rounds"
  ON rounds FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN players p ON p.id = g.host_player
      WHERE g.id = rounds.game_id
        AND p.auth_id = auth.uid()
    )
  );

-- Player Answers: players can submit their own answers, game members can read
CREATE POLICY "Players can submit own answers"
  ON player_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = player_answers.player_id
        AND p.auth_id = auth.uid()
    )
  );

CREATE POLICY "Game members can read player answers"
  ON player_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rounds r
      JOIN team_members tm ON tm.game_id = r.game_id
      JOIN players p ON p.id = tm.player_id
      WHERE r.id = player_answers.round_id
        AND p.auth_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM rounds r
      JOIN games g ON g.id = r.game_id
      JOIN players p ON p.id = g.host_player
      WHERE r.id = player_answers.round_id
        AND p.auth_id = auth.uid()
    )
  );

-- Fast Money: game members can read
CREATE POLICY "Game members can read fast money"
  ON fast_money FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN players p ON p.id = tm.player_id
      WHERE tm.game_id = fast_money.game_id
        AND p.auth_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM games g
      JOIN players p ON p.id = g.host_player
      WHERE g.id = fast_money.game_id
        AND p.auth_id = auth.uid()
    )
  );

CREATE POLICY "Host can manage fast money"
  ON fast_money FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN players p ON p.id = g.host_player
      WHERE g.id = fast_money.game_id
        AND p.auth_id = auth.uid()
    )
  );

-- Buzzer Events: game members can read, players can insert own
CREATE POLICY "Game members can read buzzer events"
  ON buzzer_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rounds r
      JOIN team_members tm ON tm.game_id = r.game_id
      JOIN players p ON p.id = tm.player_id
      WHERE r.id = buzzer_events.round_id
        AND p.auth_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM rounds r
      JOIN games g ON g.id = r.game_id
      JOIN players p ON p.id = g.host_player
      WHERE r.id = buzzer_events.round_id
        AND p.auth_id = auth.uid()
    )
  );

CREATE POLICY "Players can insert own buzzer events"
  ON buzzer_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = buzzer_events.player_id
        AND p.auth_id = auth.uid()
    )
  );

-- ===================
-- ENABLE REALTIME
-- ===================

ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
ALTER PUBLICATION supabase_realtime ADD TABLE buzzer_events;
ALTER PUBLICATION supabase_realtime ADD TABLE player_answers;
ALTER PUBLICATION supabase_realtime ADD TABLE fast_money;
