ALTER TABLE public.homework
  ADD COLUMN IF NOT EXISTS planning_status text NOT NULL DEFAULT 'planned',
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS planned_at timestamptz;

ALTER TABLE public.homework
  ADD CONSTRAINT homework_planning_status_check CHECK (planning_status IN ('pending','planned'));

CREATE INDEX IF NOT EXISTS idx_homework_planning_status ON public.homework(child_id, planning_status);

CREATE TABLE public.homework_plan_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  homework_id uuid NOT NULL REFERENCES public.homework(id) ON DELETE CASCADE,
  title text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_homework_plan_items_homework_id ON public.homework_plan_items(homework_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.homework_plan_items TO authenticated;
GRANT ALL ON public.homework_plan_items TO service_role;

ALTER TABLE public.homework_plan_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view plan items"
ON public.homework_plan_items FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.homework h
  JOIN public.children c ON c.id = h.child_id
  WHERE h.id = homework_plan_items.homework_id
    AND public.user_belongs_to_family(auth.uid(), c.family_id)
));

CREATE POLICY "Family members can create plan items"
ON public.homework_plan_items FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.homework h
  JOIN public.children c ON c.id = h.child_id
  WHERE h.id = homework_plan_items.homework_id
    AND public.user_belongs_to_family(auth.uid(), c.family_id)
));

CREATE POLICY "Family members can update plan items"
ON public.homework_plan_items FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.homework h
  JOIN public.children c ON c.id = h.child_id
  WHERE h.id = homework_plan_items.homework_id
    AND public.user_belongs_to_family(auth.uid(), c.family_id)
));

CREATE POLICY "Family members can delete plan items"
ON public.homework_plan_items FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.homework h
  JOIN public.children c ON c.id = h.child_id
  WHERE h.id = homework_plan_items.homework_id
    AND public.user_belongs_to_family(auth.uid(), c.family_id)
));