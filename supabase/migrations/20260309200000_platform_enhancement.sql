-- ============================================================
-- Platform Enhancement Migration
-- Adds: KYC, demo trading, quiz system, lesson types, push notifications
-- ============================================================

-- Add new columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS virtual_balance  numeric       NOT NULL DEFAULT 10000.00,
  ADD COLUMN IF NOT EXISTS is_banned        boolean       NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ban_reason       text,
  ADD COLUMN IF NOT EXISTS kyc_status       text          NOT NULL DEFAULT 'none';
-- kyc_status values: none | pending | approved | rejected

-- Allow 'vvip' as subscription_tier value (column is text, no constraint change needed)

-- ─── KYC Submissions ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kyc_submissions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  status          text        NOT NULL DEFAULT 'pending',
  full_name       text,
  date_of_birth   date,
  country         text,
  id_front_url    text,
  id_back_url     text,
  selfie_url      text,
  reviewer_notes  text,
  submitted_at    timestamptz DEFAULT now(),
  reviewed_at     timestamptz,
  reviewed_by     uuid        REFERENCES profiles(id)
);

ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own KYC"
  ON kyc_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own KYC"
  ON kyc_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own pending KYC"
  ON kyc_submissions FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins manage all KYC"
  ON kyc_submissions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─── Demo Trades ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS demo_trades (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        REFERENCES profiles(id) ON DELETE CASCADE,
  pair        text        NOT NULL,
  trade_type  text        NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  entry_price numeric     NOT NULL,
  exit_price  numeric,
  quantity    numeric     NOT NULL,
  profit_loss numeric     NOT NULL DEFAULT 0,
  status      text        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  opened_at   timestamptz DEFAULT now(),
  closed_at   timestamptz
);

ALTER TABLE demo_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own demo trades"
  ON demo_trades FOR ALL
  USING (auth.uid() = user_id);

-- ─── Enhance Lessons ──────────────────────────────────────────────────────────
-- lesson_type: text | youtube | pdf | audio | quiz
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS lesson_type       text    NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS youtube_embed_id  text,
  ADD COLUMN IF NOT EXISTS pdf_url           text,
  ADD COLUMN IF NOT EXISTS audio_url         text,
  ADD COLUMN IF NOT EXISTS is_free           boolean NOT NULL DEFAULT false;

-- ─── Quizzes ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quizzes (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id     uuid    REFERENCES lessons(id) ON DELETE CASCADE,
  question      text    NOT NULL,
  options       jsonb   NOT NULL,   -- string[]
  correct_index integer NOT NULL,
  explanation   text,
  order_index   integer NOT NULL DEFAULT 0
);

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read quizzes"
  ON quizzes FOR SELECT USING (true);

CREATE POLICY "Admins manage quizzes"
  ON quizzes FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─── Quiz Scores ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_scores (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id    uuid        REFERENCES lessons(id) ON DELETE CASCADE,
  score        integer     NOT NULL,
  total        integer     NOT NULL,
  completed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE quiz_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own quiz scores"
  ON quiz_scores FOR ALL
  USING (auth.uid() = user_id);

-- ─── Admin Push Notifications Log ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_notifications (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text        NOT NULL,
  body        text        NOT NULL,
  target_tier text        NOT NULL DEFAULT 'all',
  sent_by     uuid        REFERENCES profiles(id),
  sent_at     timestamptz DEFAULT now()
);

ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage push notifications"
  ON push_notifications FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─── Supabase Storage Buckets (run via dashboard if CLI not available) ─────────
-- CREATE BUCKET IF NOT EXISTS 'kyc-documents' (private)
-- CREATE BUCKET IF NOT EXISTS 'course-pdfs' (public)
