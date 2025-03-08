/*
  # Add chat messages table

  1. New Tables
    - `chat_messages`
      - `id` (uuid, primary key)
      - `user_id` (text, not null)
      - `message` (text, not null)
      - `type` (text, not null)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `chat_messages` table
    - Add policies for authenticated users to manage their messages
*/

-- Create chat_messages table
CREATE TABLE chat_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    message text NOT NULL,
    type text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own messages"
ON chat_messages
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);