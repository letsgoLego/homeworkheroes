-- Create ad-hoc tasks table for standalone tasks not tied to homework
CREATE TABLE public.adhoc_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  title text NOT NULL,
  task_date date NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_adhoc_tasks_child_date ON public.adhoc_tasks(child_id, task_date);

-- Enable RLS
ALTER TABLE public.adhoc_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Family members can view adhoc tasks"
  ON public.adhoc_tasks
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM children c
    WHERE c.id = adhoc_tasks.child_id
    AND user_belongs_to_family(auth.uid(), c.family_id)
  ));

CREATE POLICY "Family members can create adhoc tasks"
  ON public.adhoc_tasks
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM children c
    WHERE c.id = adhoc_tasks.child_id
    AND user_belongs_to_family(auth.uid(), c.family_id)
  ));

CREATE POLICY "Family members can update adhoc tasks"
  ON public.adhoc_tasks
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM children c
    WHERE c.id = adhoc_tasks.child_id
    AND user_belongs_to_family(auth.uid(), c.family_id)
  ));

CREATE POLICY "Family members can delete adhoc tasks"
  ON public.adhoc_tasks
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM children c
    WHERE c.id = adhoc_tasks.child_id
    AND user_belongs_to_family(auth.uid(), c.family_id)
  ));