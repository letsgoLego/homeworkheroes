
-- Create activities table
CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  title text NOT NULL,
  emoji text DEFAULT '⚽',
  weekdays integer[] DEFAULT '{}',
  specific_date date,
  start_time time,
  end_time time,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- RLS policies mirroring recurring_pack_items
CREATE POLICY "Family members can view activities"
  ON public.activities FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM children c
    WHERE c.id = activities.child_id AND user_belongs_to_family(auth.uid(), c.family_id)
  ));

CREATE POLICY "Family members can create activities"
  ON public.activities FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM children c
    WHERE c.id = activities.child_id AND user_belongs_to_family(auth.uid(), c.family_id)
  ));

CREATE POLICY "Family members can update activities"
  ON public.activities FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM children c
    WHERE c.id = activities.child_id AND user_belongs_to_family(auth.uid(), c.family_id)
  ));

CREATE POLICY "Family members can delete activities"
  ON public.activities FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM children c
    WHERE c.id = activities.child_id AND user_belongs_to_family(auth.uid(), c.family_id)
  ));
