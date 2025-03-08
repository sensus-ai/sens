/*
  # Update storage and tables schema
  
  1. Changes
    - Create recordings table with text user_id
    - Create user_daily_recordings table
    - Update RLS policies
  
  2. Security
    - Enable RLS on all tables
    - Allow authenticated users access
*/

-- Drop existing policies if they exist
DO $$ BEGIN
    DROP POLICY IF EXISTS "recordings_insert_policy" ON recordings;
    DROP POLICY IF EXISTS "recordings_select_policy" ON recordings;
    DROP POLICY IF EXISTS "daily_recordings_select_policy" ON user_daily_recordings;
    DROP POLICY IF EXISTS "daily_recordings_insert_policy" ON user_daily_recordings;
    DROP POLICY IF EXISTS "daily_recordings_update_policy" ON user_daily_recordings;
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

-- Create recordings table
CREATE TABLE IF NOT EXISTS recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  topic text NOT NULL,
  duration integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  video_url text NOT NULL,
  rewarded boolean DEFAULT false
);

-- Create user_daily_recordings table
CREATE TABLE IF NOT EXISTS user_daily_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  date date DEFAULT CURRENT_DATE,
  total_duration integer DEFAULT 0,
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_recordings ENABLE ROW LEVEL SECURITY;

-- Table policies for recordings
CREATE POLICY "recordings_insert_policy"
  ON recordings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "recordings_select_policy"
  ON recordings
  FOR SELECT
  TO authenticated
  USING (true);

-- Table policies for user_daily_recordings
CREATE POLICY "daily_recordings_select_policy"
  ON user_daily_recordings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "daily_recordings_insert_policy"
  ON user_daily_recordings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "daily_recordings_update_policy"
  ON user_daily_recordings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);