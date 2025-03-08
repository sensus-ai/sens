-- Drop existing table and recreate with correct schema
DROP TABLE IF EXISTS public.referrals;

CREATE TABLE public.referrals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id text NOT NULL,
    referred_id text NOT NULL UNIQUE,
    status text DEFAULT 'pending',
    tx_hash text,
    error_message text,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX referrals_referrer_id_idx ON public.referrals(referrer_id);
CREATE INDEX referrals_status_idx ON public.referrals(status);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable all operations for authenticated users" 
ON public.referrals FOR ALL TO authenticated 
USING (true) WITH CHECK (true);

-- Grants
GRANT ALL ON TABLE public.referrals TO authenticated;
GRANT ALL ON TABLE public.referrals TO service_role;