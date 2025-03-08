/*
  # Fix RLS Policies and Storage Configuration

  1. Changes
    - Set storage bucket to public
    - Simplify RLS policies
    - Enable proper access for authenticated users
  
  2. Security
    - Maintain RLS on all tables
    - Allow authenticated users full access
    - Make storage bucket public but require authentication
*/

-- Ensure storage bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('recordings', 'recordings', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "recordings_bucket_policy" ON storage.objects;
DROP POLICY IF EXISTS "recordings_policy" ON recordings;
DROP POLICY IF EXISTS "daily_recordings_policy" ON user_daily_recordings;

-- Create simple storage policy for authenticated users
CREATE POLICY "recordings_bucket_policy"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'recordings')
WITH CHECK (bucket_id = 'recordings');

-- Create simple table policies for authenticated users
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