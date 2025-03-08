/*
  # Initial Schema Setup for SensusAI

  1. New Tables
    - `recordings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `topic` (text)
      - `duration` (integer, in seconds)
      - `created_at` (timestamp)
      - `video_url` (text)
      - `rewarded` (boolean)
    - `user_daily_recordings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `date` (date)
      - `total_duration` (integer, in seconds)
      
  2. Security
    - Enable RLS on both tables
    - Add policies for users to access their own data
*/

-- Create recordings table
CREATE TABLE IF NOT EXISTS recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  topic text NOT NULL,
  duration integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  video_url text NOT NULL,
  rewarded boolean DEFAULT false
);

-- Create user_daily_recordings table
CREATE TABLE IF NOT EXISTS user_daily_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  date date DEFAULT CURRENT_DATE,
  total_duration integer DEFAULT 0,
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_recordings ENABLE ROW LEVEL SECURITY;

-- Policies for recordings
CREATE POLICY "Users can insert their own recordings"
  ON recordings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own recordings"
  ON recordings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for user_daily_recordings
CREATE POLICY "Users can view their own daily recordings"
  ON user_daily_recordings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily recordings"
  ON user_daily_recordings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);