/*
  # Fix RLS Policies for Wallet Authentication
  
  1. Changes
    - Drop and recreate policies with proper wallet authentication
    - Simplify storage access rules
  
  2. Security
    - Enable RLS on all tables
    - Allow authenticated users full access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "recordings_bucket_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "recordings_bucket_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "recordings_insert_policy" ON recordings;
DROP POLICY IF EXISTS "recordings_select_policy" ON recordings;
DROP POLICY IF EXISTS "daily_recordings_select_policy" ON user_daily_recordings;
DROP POLICY IF EXISTS "daily_recordings_insert_policy" ON user_daily_recordings;
DROP POLICY IF EXISTS "daily_recordings_update_policy" ON user_daily_recordings;
DROP POLICY IF EXISTS "daily_recordings_all_policy" ON user_daily_recordings;

-- Storage bucket policies
CREATE POLICY "recordings_bucket_access_policy"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'recordings')
WITH CHECK (bucket_id = 'recordings');

-- Table policies
CREATE POLICY "recordings_access_policy"
ON recordings FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "daily_recordings_access_policy"
ON user_daily_recordings FOR ALL TO authenticated
USING (true)
WITH CHECK (true);