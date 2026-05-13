
-- 1. Fix user_belongs_to_family to respect blocked flag
CREATE OR REPLACE FUNCTION public.user_belongs_to_family(_user_id uuid, _family_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND family_id = _family_id
      AND blocked = false
  )
$$;

-- 2. Add family-scoped role check
CREATE OR REPLACE FUNCTION public.has_role_in_family(_user_id uuid, _role app_role, _family_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND family_id = _family_id
      AND blocked = false
  )
$$;

-- 3. Lock down user_roles INSERT (drop the open self-insert policy)
DROP POLICY IF EXISTS "Authenticated users can insert their roles" ON public.user_roles;

-- Legitimate role assignment now goes through SECURITY DEFINER RPCs:
--   * create_family_with_role  (existing)
--   * join_family_with_invite_code  (new, below)
--   * create-child-account edge function (uses service role)

-- 4. New SECURITY DEFINER RPC for joining a family via invite code
CREATE OR REPLACE FUNCTION public.join_family_with_invite_code(_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _family_id uuid;
  _existing_role_id uuid;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _code IS NULL OR _code !~ '^[a-f0-9]{8}$' THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  SELECT id INTO _family_id
  FROM public.families
  WHERE invite_code = _code
  LIMIT 1;

  IF _family_id IS NULL THEN
    RAISE EXCEPTION 'Family not found';
  END IF;

  -- If already a member, just return the family
  SELECT id INTO _existing_role_id
  FROM public.user_roles
  WHERE user_id = _user_id AND family_id = _family_id
  LIMIT 1;

  IF _existing_role_id IS NOT NULL THEN
    RETURN _family_id;
  END IF;

  -- Enforce family member cap (max 6 per memory)
  IF (SELECT count(*) FROM public.user_roles WHERE family_id = _family_id) >= 6 THEN
    RAISE EXCEPTION 'Family member limit reached';
  END IF;

  INSERT INTO public.user_roles (user_id, role, family_id)
  VALUES (_user_id, 'parent'::app_role, _family_id);

  RETURN _family_id;
END;
$$;

REVOKE ALL ON FUNCTION public.join_family_with_invite_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_family_with_invite_code(text) TO authenticated;

-- 5. Restrict families UPDATE to parents only
DROP POLICY IF EXISTS "Family members can update their family" ON public.families;

CREATE POLICY "Only parents can update their family"
  ON public.families FOR UPDATE
  TO authenticated
  USING (
    public.has_role_in_family(auth.uid(), 'parent'::app_role, id)
  )
  WITH CHECK (
    public.has_role_in_family(auth.uid(), 'parent'::app_role, id)
  );

-- 6. Tighten nudges INSERT policy to use family-scoped role check
DROP POLICY IF EXISTS "Parents can send nudges to own family children" ON public.nudges;

CREATE POLICY "Parents can send nudges to own family children"
  ON public.nudges FOR INSERT
  TO authenticated
  WITH CHECK (
    from_user_id = auth.uid()
    AND public.has_role_in_family(auth.uid(), 'parent'::app_role, family_id)
    AND EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.id = nudges.to_child_id AND c.family_id = nudges.family_id
    )
    AND EXTRACT(hour FROM (now() AT TIME ZONE 'Europe/Stockholm')) >= 7
    AND EXTRACT(hour FROM (now() AT TIME ZONE 'Europe/Stockholm')) <= 20
    AND (
      SELECT count(*) FROM public.nudges n
      WHERE n.from_user_id = auth.uid()
        AND n.to_child_id = nudges.to_child_id
        AND ((n.created_at AT TIME ZONE 'Europe/Stockholm')::date
             = (now() AT TIME ZONE 'Europe/Stockholm')::date)
    ) < 2
  );

-- 7. Defense-in-depth: explicit lockdown on app_config (no client access)
CREATE POLICY "Deny all client access to app_config"
  ON public.app_config FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

-- 8. Input validation CHECK constraints
ALTER TABLE public.children
  ADD CONSTRAINT check_child_name_length
  CHECK (length(trim(name)) > 0 AND length(name) <= 100);

ALTER TABLE public.homework
  ADD CONSTRAINT check_hw_title_length
  CHECK (length(trim(title)) > 0 AND length(title) <= 500);

ALTER TABLE public.homework
  ADD CONSTRAINT check_hw_description_length
  CHECK (description IS NULL OR length(description) <= 5000);

ALTER TABLE public.adhoc_tasks
  ADD CONSTRAINT check_adhoc_title_length
  CHECK (length(trim(title)) > 0 AND length(title) <= 200);

ALTER TABLE public.study_tasks
  ADD CONSTRAINT check_study_title_length
  CHECK (length(trim(title)) > 0 AND length(title) <= 200);
