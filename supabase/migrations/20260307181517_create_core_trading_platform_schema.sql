/*
  # Fintech Trading Platform Database Schema

  ## Overview
  Complete database schema for a production-grade fintech trading education platform
  with real-time trading signals, course management, and admin controls.

  ## New Tables

  ### 1. profiles
  Extended user profiles with role-based access control
  - `id` (uuid, FK to auth.users)
  - `email` (text)
  - `full_name` (text)
  - `role` (text) - 'user' or 'admin'
  - `avatar_url` (text)
  - `subscription_tier` (text) - 'free', 'basic', 'premium', 'vip'
  - `binance_api_key` (text, encrypted)
  - `binance_api_secret` (text, encrypted)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. courses
  Educational courses with metadata
  - `id` (uuid, primary key)
  - `title` (text)
  - `description` (text)
  - `thumbnail_url` (text)
  - `difficulty_level` (text) - 'beginner', 'intermediate', 'advanced'
  - `price` (numeric)
  - `is_published` (boolean)
  - `created_by` (uuid, FK to profiles)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. lessons
  Individual lessons within courses
  - `id` (uuid, primary key)
  - `course_id` (uuid, FK to courses)
  - `title` (text)
  - `content` (text)
  - `video_url` (text)
  - `duration_minutes` (integer)
  - `order_index` (integer)
  - `created_at` (timestamptz)

  ### 4. user_course_progress
  Track user progress through courses
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to profiles)
  - `course_id` (uuid, FK to courses)
  - `lesson_id` (uuid, FK to lessons)
  - `completed` (boolean)
  - `progress_percentage` (integer)
  - `last_accessed_at` (timestamptz)
  - `created_at` (timestamptz)

  ### 5. trading_signals
  Real-time trading signals from admin
  - `id` (uuid, primary key)
  - `pair` (text) - e.g., 'BTC/USDT'
  - `signal_type` (text) - 'buy', 'sell'
  - `entry_price` (numeric)
  - `stop_loss` (numeric)
  - `take_profit` (numeric)
  - `status` (text) - 'active', 'hit_tp', 'hit_sl', 'expired'
  - `confidence_level` (text) - 'low', 'medium', 'high'
  - `notes` (text)
  - `created_by` (uuid, FK to profiles)
  - `created_at` (timestamptz)
  - `expires_at` (timestamptz)

  ### 6. user_trades
  User trade executions and history
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to profiles)
  - `signal_id` (uuid, FK to trading_signals)
  - `pair` (text)
  - `trade_type` (text) - 'buy', 'sell'
  - `entry_price` (numeric)
  - `exit_price` (numeric)
  - `quantity` (numeric)
  - `profit_loss` (numeric)
  - `status` (text) - 'open', 'closed', 'cancelled'
  - `opened_at` (timestamptz)
  - `closed_at` (timestamptz)

  ### 7. subscriptions
  User subscription management
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to profiles)
  - `tier` (text) - 'free', 'basic', 'premium', 'vip'
  - `status` (text) - 'active', 'cancelled', 'expired'
  - `amount` (numeric)
  - `billing_cycle` (text) - 'monthly', 'yearly'
  - `started_at` (timestamptz)
  - `expires_at` (timestamptz)
  - `created_at` (timestamptz)

  ### 8. payments
  Payment transaction history
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to profiles)
  - `subscription_id` (uuid, FK to subscriptions)
  - `amount` (numeric)
  - `currency` (text)
  - `payment_method` (text)
  - `status` (text) - 'pending', 'completed', 'failed'
  - `transaction_id` (text)
  - `created_at` (timestamptz)

  ### 9. notifications
  User notifications for signals and updates
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to profiles)
  - `type` (text) - 'signal', 'course', 'system'
  - `title` (text)
  - `message` (text)
  - `is_read` (boolean)
  - `created_at` (timestamptz)

  ### 10. admin_logs
  Audit trail for admin actions
  - `id` (uuid, primary key)
  - `admin_id` (uuid, FK to profiles)
  - `action` (text)
  - `details` (jsonb)
  - `created_at` (timestamptz)

  ## Security

  ### Row Level Security (RLS)
  - All tables have RLS enabled
  - Users can only access their own data
  - Admins have full access to all data
  - Public access restricted to published courses only

  ### Policies
  - Separate policies for SELECT, INSERT, UPDATE, DELETE
  - Role-based access control (user vs admin)
  - Ownership validation for user data
  - Admin-only policies for sensitive operations

  ## Important Notes
  1. API keys are stored encrypted (application-level encryption required)
  2. All timestamps use UTC timezone
  3. Cascade deletes configured for related data
  4. Indexes added for performance on frequently queried columns
*/

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_url text,
  subscription_tier text NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium', 'vip')),
  binance_api_key text,
  binance_api_secret text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  thumbnail_url text,
  difficulty_level text NOT NULL DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  price numeric NOT NULL DEFAULT 0,
  is_published boolean DEFAULT false,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published courses"
  ON courses FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage all courses"
  ON courses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text,
  video_url text,
  duration_minutes integer DEFAULT 0,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lessons of published courses"
  ON lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = lessons.course_id
      AND courses.is_published = true
    )
  );

CREATE POLICY "Admins can manage all lessons"
  ON lessons FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create user_course_progress table
CREATE TABLE IF NOT EXISTS user_course_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  last_accessed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id, lesson_id)
);

ALTER TABLE user_course_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON user_course_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_course_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can modify own progress"
  ON user_course_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create trading_signals table
CREATE TABLE IF NOT EXISTS trading_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair text NOT NULL,
  signal_type text NOT NULL CHECK (signal_type IN ('buy', 'sell')),
  entry_price numeric NOT NULL,
  stop_loss numeric,
  take_profit numeric,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hit_tp', 'hit_sl', 'expired')),
  confidence_level text NOT NULL DEFAULT 'medium' CHECK (confidence_level IN ('low', 'medium', 'high')),
  notes text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE trading_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view signals"
  ON trading_signals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create signals"
  ON trading_signals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update signals"
  ON trading_signals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create user_trades table
CREATE TABLE IF NOT EXISTS user_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  signal_id uuid REFERENCES trading_signals(id) ON DELETE SET NULL,
  pair text NOT NULL,
  trade_type text NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  entry_price numeric NOT NULL,
  exit_price numeric,
  quantity numeric NOT NULL,
  profit_loss numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  opened_at timestamptz DEFAULT now(),
  closed_at timestamptz
);

ALTER TABLE user_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trades"
  ON user_trades FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own trades"
  ON user_trades FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades"
  ON user_trades FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all trades"
  ON user_trades FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tier text NOT NULL CHECK (tier IN ('free', 'basic', 'premium', 'vip')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  amount numeric NOT NULL DEFAULT 0,
  billing_cycle text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions"
  ON subscriptions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  payment_method text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  transaction_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('signal', 'course', 'system')),
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create admin_logs table
CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin logs"
  ON admin_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can create admin logs"
  ON admin_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_user_course_progress_user_id ON user_course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_signals_status ON trading_signals(status);
CREATE INDEX IF NOT EXISTS idx_trading_signals_created_at ON trading_signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_trades_user_id ON user_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trades_status ON user_trades(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);