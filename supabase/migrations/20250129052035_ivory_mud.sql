/*
  # Storage and Table Setup with Policy Updates
  
  1. Changes
    - Drop existing policies to avoid conflicts
    - Create storage bucket for recordings
    - Set up tables with text user_id for wallet addresses
    - Configure RLS policies
  
  2. Security
    - Enable RLS on all tables
    - Add storage access policies
    - Set up table-level policies
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "recordings_bucket_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "recordings_bucket_select_policy" ON storage.objects;

-- Create storage bucket for recordings if it doesn't exist
INSERT INTO storage.buckets (id, name)
VALUES ('recordings', 'recordings')
ON CONFLICT DO NOTHING;

-- Drop existing tables to recreate with new user_id type
DROP TABLE IF EXISTS user_daily_recordings;
DROP TABLE IF EXISTS recordings;

-- Create recordings table
CREATE TABLE recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  topic text NOT NULL,
  duration integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  video_url text NOT NULL,
  rewarded boolean DEFAULT false
);

-- Create user_daily_recordings table
CREATE TABLE user_daily_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  date date DEFAULT CURRENT_DATE,
  total_duration integer DEFAULT 0,
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_recordings ENABLE ROW LEVEL SECURITY;

-- Storage bucket policies
CREATE POLICY "recordings_bucket_insert_policy"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'recordings' AND auth.role() = 'authenticated');

CREATE POLICY "recordings_bucket_select_policy"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'recordings' AND auth.role() = 'authenticated');

-- Table policies
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

CREATE POLICY "daily_recordings_select_policy"
  ON user_daily_recordings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "daily_recordings_all_policy"
  ON user_daily_recordings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);