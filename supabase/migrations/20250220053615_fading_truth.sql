-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id text NOT NULL,
  referred_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  rewarded boolean DEFAULT false,
  UNIQUE(referred_id)
);

-- Enable RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Create policy for referrals
CREATE POLICY "referrals_policy"
ON referrals
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);