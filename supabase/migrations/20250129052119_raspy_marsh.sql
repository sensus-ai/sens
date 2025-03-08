/*
  # Fix RLS Policies for Wallet Authentication
  
  1. Changes
    - Drop existing policies
    - Recreate tables with proper RLS policies for wallet addresses
    - Add storage policies with proper folder checks
  
  2. Security
    - Enable RLS on all tables
    - Restrict access to user's own data using wallet address
    - Ensure storage access matches wallet address
*/

-- Drop existing policies
DROP POLICY IF EXISTS "recordings_bucket_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "recordings_bucket_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "recordings_insert_policy" ON recordings;
DROP POLICY IF EXISTS "recordings_select_policy" ON recordings;
DROP POLICY IF EXISTS "daily_recordings_select_policy" ON user_daily_recordings;
DROP POLICY IF EXISTS "daily_recordings_all_policy" ON user_daily_recordings;

-- Create storage bucket for recordings if it doesn't exist
INSERT INTO storage.buckets (id, name)
VALUES ('recordings', 'recordings')
ON CONFLICT DO NOTHING;

-- Drop existing tables to recreate
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

-- Storage bucket policies with proper folder checks
CREATE POLICY "recordings_bucket_insert_policy"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'recordings' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = substring(auth.jwt() ->> 'sub' from 'auth0\|(.*)$')
);

CREATE POLICY "recordings_bucket_select_policy"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'recordings' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = substring(auth.jwt() ->> 'sub' from 'auth0\|(.*)$')
);

-- Table policies with wallet address checks
CREATE POLICY "recordings_insert_policy"
ON recordings
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = substring(auth.jwt() ->> 'sub' from 'auth0\|(.*)$')
);

CREATE POLICY "recordings_select_policy"
ON recordings
FOR SELECT
TO authenticated
USING (
  user_id = substring(auth.jwt() ->> 'sub' from 'auth0\|(.*)$')
);

-- Daily recordings policies
CREATE POLICY "daily_recordings_select_policy"
ON user_daily_recordings
FOR SELECT
TO authenticated
USING (
  user_id = substring(auth.jwt() ->> 'sub' from 'auth0\|(.*)$')
);

CREATE POLICY "daily_recordings_insert_policy"
ON user_daily_recordings
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = substring(auth.jwt() ->> 'sub' from 'auth0\|(.*)$')
);

CREATE POLICY "daily_recordings_update_policy"
ON user_daily_recordings
FOR UPDATE
TO authenticated
USING (
  user_id = substring(auth.jwt() ->> 'sub' from 'auth0\|(.*)$')
)
WITH CHECK (
  user_id = substring(auth.jwt() ->> 'sub' from 'auth0\|(.*)$')
);