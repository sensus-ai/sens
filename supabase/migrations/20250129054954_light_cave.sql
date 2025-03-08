/*
  # Fix permissions for video uploads

  1. Changes
    - Ensure storage bucket exists and is public
    - Set up proper storage policies
    - Update table policies to be more permissive
*/

-- Ensure storage bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('recordings', 'recordings', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "recordings_bucket_policy" ON storage.objects;
DROP POLICY IF EXISTS "recordings_insert_policy" ON recordings;
DROP POLICY IF EXISTS "recordings_select_policy" ON recordings;
DROP POLICY IF EXISTS "daily_recordings_select_policy" ON user_daily_recordings;
DROP POLICY IF EXISTS "daily_recordings_insert_policy" ON user_daily_recordings;
DROP POLICY IF EXISTS "daily_recordings_update_policy" ON user_daily_recordings;

-- Create storage policies
CREATE POLICY "recordings_bucket_policy"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'recordings')
WITH CHECK (bucket_id = 'recordings');

-- Create table policies
CREATE POLICY "recordings_policy"
ON recordings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "daily_recordings_policy"
ON user_daily_recordings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_recordings ENABLE ROW LEVEL SECURITY;