/*
  # Fix storage permissions for video uploads

  1. Changes
    - Create recordings storage bucket if not exists
    - Add storage bucket policies for authenticated users
    - Enable public access for recordings bucket
*/

-- Create storage bucket for recordings if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('recordings', 'recordings', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop any existing storage policies
DROP POLICY IF EXISTS "recordings_bucket_policy" ON storage.objects;

-- Create a single policy for all operations on the recordings bucket
CREATE POLICY "recordings_bucket_policy"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'recordings')
WITH CHECK (bucket_id = 'recordings');