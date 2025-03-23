-- Run in Supabase SQL Editor
select * from recordings limit 1;

-- Add description column
ALTER TABLE recordings
ADD COLUMN IF NOT EXISTS description TEXT;

-- Create policy for video description updates
CREATE POLICY "Users can update their own video descriptions"
ON recordings
FOR UPDATE USING (
    auth.uid()::text = user_id::text
)
WITH CHECK (
    auth.uid()::text = user_id::text
);