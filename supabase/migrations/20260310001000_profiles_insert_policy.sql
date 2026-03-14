-- Allow authenticated users to insert their own profile row
-- This complements the auth.users trigger and covers cases where a profile
-- may not exist yet (e.g., legacy users or dashboard-created users)

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

