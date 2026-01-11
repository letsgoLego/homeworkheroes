-- Add submission_day column for recurring homework
ALTER TABLE public.homework 
ADD COLUMN submission_day integer DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.homework.submission_day IS 'Day of week for recurring homework submission (0=Sunday, 1=Monday, ..., 6=Saturday)';