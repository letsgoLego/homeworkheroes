-- Add reminder columns to homework table
ALTER TABLE public.homework 
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_date DATE;

-- Create index for efficient reminder queries
CREATE INDEX IF NOT EXISTS idx_homework_reminder ON public.homework(reminder_date, reminder_sent) WHERE reminder_sent = false;