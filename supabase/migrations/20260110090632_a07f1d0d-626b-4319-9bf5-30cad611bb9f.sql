-- Add recurring homework support
ALTER TABLE public.homework 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_days INTEGER[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS recurrence_end_date DATE DEFAULT NULL;

-- Add index for recurring homework queries
CREATE INDEX IF NOT EXISTS idx_homework_recurring ON public.homework(is_recurring, child_id) WHERE is_recurring = true;

COMMENT ON COLUMN public.homework.recurrence_days IS 'Array of day numbers (0=Sunday, 1=Monday, etc.) when tasks should be created';