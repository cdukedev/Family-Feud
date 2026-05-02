-- ============================================================
-- Fix RLS policies - remove cross-table recursion
-- ============================================================

-- Drop all existing RLS policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Players: readable by all, own-record writes
CREATE POLICY "Anyone can read players"
  ON players FOR SELECT USING (true);
CREATE POLICY "Players can insert own record"
  ON players FOR INSERT WITH CHECK (auth_id = auth.uid());
CREATE POLICY "Players can update own record"
  ON players FOR UPDATE USING (auth_id = auth.uid());

-- Games: readable by all, authenticated can create/update
CREATE POLICY "Anyone can read games"
  ON games FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create games"
  ON games FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Anyone can update games"
  ON games FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Teams: readable by all, authenticated can manage
CREATE POLICY "Anyone can read teams"
  ON teams FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage teams"
  ON teams FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update teams"
  ON teams FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Team Members: readable by all, authenticated can insert
CREATE POLICY "Anyone can read team members"
  ON team_members FOR SELECT USING (true);
CREATE POLICY "Authenticated can join teams"
  ON team_members FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Questions & Answers: public read, authenticated write
CREATE POLICY "Anyone can read questions"
  ON questions FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert questions"
  ON questions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Anyone can read answers"
  ON answers FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert answers"
  ON answers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Rounds: readable by all, authenticated can manage
CREATE POLICY "Anyone can read rounds"
  ON rounds FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage rounds"
  ON rounds FOR ALL USING (auth.uid() IS NOT NULL);

-- Player Answers: readable by all, authenticated can submit
CREATE POLICY "Anyone can read player answers"
  ON player_answers FOR SELECT USING (true);
CREATE POLICY "Authenticated can submit answers"
  ON player_answers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Fast Money: readable by all, authenticated can manage
CREATE POLICY "Anyone can read fast money"
  ON fast_money FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage fast money"
  ON fast_money FOR ALL USING (auth.uid() IS NOT NULL);

-- Buzzer Events: readable by all, authenticated can insert
CREATE POLICY "Anyone can read buzzer events"
  ON buzzer_events FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert buzzer events"
  ON buzzer_events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
