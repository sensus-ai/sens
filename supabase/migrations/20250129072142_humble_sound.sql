/*
  # Add status columns to recordings table

  1. Changes
    - Add `verified` column to recordings table
    - Add `flagged` column to recordings table
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add status columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recordings' AND column_name = 'verified'
  ) THEN
    ALTER TABLE recordings ADD COLUMN verified boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recordings' AND column_name = 'flagged'
  ) THEN
    ALTER TABLE recordings ADD COLUMN flagged boolean DEFAULT false;
  END IF;
END $$;