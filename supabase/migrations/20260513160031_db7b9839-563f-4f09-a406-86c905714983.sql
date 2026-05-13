
-- 1. Add presence tracking to children
ALTER TABLE public.children
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- 2. Heartbeat RPC: child updates their own last_seen_at
CREATE OR REPLACE FUNCTION public.update_child_last_seen(_child_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _allowed boolean;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- The caller must be linked to this child (child account) OR a parent in the same family
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND (
        ur.child_id = _child_id
        OR EXISTS (
          SELECT 1 FROM public.children c
          WHERE c.id = _child_id AND public.user_belongs_to_family(_user_id, c.family_id)
        )
      )
  ) INTO _allowed;

  IF NOT _allowed THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  UPDATE public.children SET last_seen_at = now() WHERE id = _child_id;
END;
$$;

-- 3. Nudges table (audit log of "peta barnet")
CREATE TABLE IF NOT EXISTS public.nudges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL,
  to_child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  family_id uuid NOT NULL,
  message text NOT NULL,
  tone text NOT NULL DEFAULT 'custom',
  delivered boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nudges_family_idx ON public.nudges (family_id, created_at DESC);
CREATE INDEX IF NOT EXISTS nudges_rate_limit_idx ON public.nudges (from_user_id, to_child_id, created_at);

ALTER TABLE public.nudges ENABLE ROW LEVEL SECURITY;

-- Parents in the same family can view nudges
CREATE POLICY "Family members can view nudges"
ON public.nudges
FOR SELECT
USING (public.user_belongs_to_family(auth.uid(), family_id));

-- Parents can send nudges, with rate limit + quiet hours + family check
CREATE POLICY "Parents can send nudges to own family children"
ON public.nudges
FOR INSERT
WITH CHECK (
  from_user_id = auth.uid()
  AND public.has_role(auth.uid(), 'parent'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.children c
    WHERE c.id = to_child_id
      AND c.family_id = nudges.family_id
      AND public.user_belongs_to_family(auth.uid(), c.family_id)
  )
  -- Quiet hours: only between 07:00 and 21:00 Europe/Stockholm
  AND EXTRACT(hour FROM (now() AT TIME ZONE 'Europe/Stockholm')) BETWEEN 7 AND 20
  -- Rate limit: max 2 per parent per child per day (Stockholm)
  AND (
    SELECT count(*) FROM public.nudges n
    WHERE n.from_user_id = auth.uid()
      AND n.to_child_id = nudges.to_child_id
      AND (n.created_at AT TIME ZONE 'Europe/Stockholm')::date
        = (now() AT TIME ZONE 'Europe/Stockholm')::date
  ) < 2
);

-- Helper RPC for clients to know remaining nudges today
CREATE OR REPLACE FUNCTION public.nudges_remaining_today(_child_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT GREATEST(0, 2 - (
    SELECT count(*)::int FROM public.nudges n
    WHERE n.from_user_id = auth.uid()
      AND n.to_child_id = _child_id
      AND (n.created_at AT TIME ZONE 'Europe/Stockholm')::date
        = (now() AT TIME ZONE 'Europe/Stockholm')::date
  ));
$$;
