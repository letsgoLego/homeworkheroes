
-- Enum for goal type
CREATE TYPE public.holiday_goal_type AS ENUM ('count_per_day', 'minutes_per_day', 'checkbox_per_day', 'total_for_holiday');

-- 1. holiday_modes
CREATE TABLE public.holiday_modes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL UNIQUE REFERENCES public.children(id) ON DELETE CASCADE,
  active boolean NOT NULL DEFAULT false,
  started_at timestamptz,
  ends_at date,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.holiday_modes TO authenticated;
GRANT ALL ON public.holiday_modes TO service_role;

ALTER TABLE public.holiday_modes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view holiday_modes"
  ON public.holiday_modes FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.children c WHERE c.id = child_id AND public.user_belongs_to_family(auth.uid(), c.family_id)));

CREATE POLICY "Family members can insert holiday_modes"
  ON public.holiday_modes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.children c WHERE c.id = child_id AND public.user_belongs_to_family(auth.uid(), c.family_id)));

CREATE POLICY "Family members can update holiday_modes"
  ON public.holiday_modes FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.children c WHERE c.id = child_id AND public.user_belongs_to_family(auth.uid(), c.family_id)));

CREATE POLICY "Family members can delete holiday_modes"
  ON public.holiday_modes FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.children c WHERE c.id = child_id AND public.user_belongs_to_family(auth.uid(), c.family_id)));

CREATE TRIGGER update_holiday_modes_updated_at
  BEFORE UPDATE ON public.holiday_modes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. holiday_goals
CREATE TABLE public.holiday_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '⭐',
  type public.holiday_goal_type NOT NULL,
  daily_target integer,
  total_target integer,
  color text NOT NULL DEFAULT '#2eb8a6',
  sort_order integer NOT NULL DEFAULT 0,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT goal_name_length CHECK (length(trim(name)) > 0 AND length(name) <= 60)
);

CREATE INDEX idx_holiday_goals_child ON public.holiday_goals(child_id) WHERE archived = false;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.holiday_goals TO authenticated;
GRANT ALL ON public.holiday_goals TO service_role;

ALTER TABLE public.holiday_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view holiday_goals"
  ON public.holiday_goals FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.children c WHERE c.id = child_id AND public.user_belongs_to_family(auth.uid(), c.family_id)));

CREATE POLICY "Family members can insert holiday_goals"
  ON public.holiday_goals FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.children c WHERE c.id = child_id AND public.user_belongs_to_family(auth.uid(), c.family_id)));

CREATE POLICY "Family members can update holiday_goals"
  ON public.holiday_goals FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.children c WHERE c.id = child_id AND public.user_belongs_to_family(auth.uid(), c.family_id)));

CREATE POLICY "Family members can delete holiday_goals"
  ON public.holiday_goals FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.children c WHERE c.id = child_id AND public.user_belongs_to_family(auth.uid(), c.family_id)));

CREATE TRIGGER update_holiday_goals_updated_at
  BEFORE UPDATE ON public.holiday_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enforce max 3 active goals per child
CREATE OR REPLACE FUNCTION public.enforce_max_holiday_goals()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.archived = false THEN
    IF (SELECT count(*) FROM public.holiday_goals WHERE child_id = NEW.child_id AND archived = false AND id <> NEW.id) >= 3 THEN
      RAISE EXCEPTION 'Max 3 active holiday goals per child';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_max_holiday_goals_trigger
  BEFORE INSERT OR UPDATE ON public.holiday_goals
  FOR EACH ROW EXECUTE FUNCTION public.enforce_max_holiday_goals();

-- 3. holiday_goal_entries
CREATE TABLE public.holiday_goal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.holiday_goals(id) ON DELETE CASCADE,
  entry_date date NOT NULL,
  value integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(goal_id, entry_date)
);

CREATE INDEX idx_holiday_entries_goal_date ON public.holiday_goal_entries(goal_id, entry_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.holiday_goal_entries TO authenticated;
GRANT ALL ON public.holiday_goal_entries TO service_role;

ALTER TABLE public.holiday_goal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view holiday_goal_entries"
  ON public.holiday_goal_entries FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.holiday_goals g
    JOIN public.children c ON c.id = g.child_id
    WHERE g.id = goal_id AND public.user_belongs_to_family(auth.uid(), c.family_id)
  ));

CREATE POLICY "Family members can insert holiday_goal_entries"
  ON public.holiday_goal_entries FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.holiday_goals g
    JOIN public.children c ON c.id = g.child_id
    WHERE g.id = goal_id AND public.user_belongs_to_family(auth.uid(), c.family_id)
  ));

CREATE POLICY "Family members can update holiday_goal_entries"
  ON public.holiday_goal_entries FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.holiday_goals g
    JOIN public.children c ON c.id = g.child_id
    WHERE g.id = goal_id AND public.user_belongs_to_family(auth.uid(), c.family_id)
  ));

CREATE POLICY "Family members can delete holiday_goal_entries"
  ON public.holiday_goal_entries FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.holiday_goals g
    JOIN public.children c ON c.id = g.child_id
    WHERE g.id = goal_id AND public.user_belongs_to_family(auth.uid(), c.family_id)
  ));

CREATE TRIGGER update_holiday_goal_entries_updated_at
  BEFORE UPDATE ON public.holiday_goal_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
