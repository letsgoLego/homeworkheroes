ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS excluded_dates date[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS end_date date;