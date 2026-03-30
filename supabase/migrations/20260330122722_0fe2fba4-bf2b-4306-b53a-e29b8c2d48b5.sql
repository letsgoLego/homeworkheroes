ALTER TABLE public.families
ADD COLUMN subscription_status text DEFAULT 'free',
ADD COLUMN subscription_end timestamptz,
ADD COLUMN subscription_interval text,
ADD COLUMN subscription_checked_at timestamptz;