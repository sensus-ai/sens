-- Drop the existing table if it exists
DROP TABLE IF EXISTS public.referrals;

-- Create the merged referrals table
CREATE TABLE public.referrals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id text NOT NULL,
    referred_id text NOT NULL UNIQUE,
    -- Columns from first migration:
    status text DEFAULT 'pending',
    tx_hash text,
    error_message text,
    -- Column from second migration:
    rewarded boolean DEFAULT false,
    -- Choose a default for created_at; here we use UTC as in the first migration
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX referrals_referrer_id_idx ON public.referrals(referrer_id);
CREATE INDEX referrals_status_idx ON public.referrals(status);

-- Enable Row-Level Security (RLS)
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Create a unified policy for authenticated users
CREATE POLICY "Enable all operations for authenticated users" 
ON public.referrals
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Grants for roles
GRANT ALL ON TABLE public.referrals TO authenticated;
GRANT ALL ON TABLE public.referrals TO service_role;
