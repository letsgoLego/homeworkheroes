CREATE OR REPLACE FUNCTION public.create_family_with_role(_family_name text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _user_id uuid;
  _family_id uuid;
  _existing uuid;
BEGIN
  _user_id := auth.uid();

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  IF _family_name IS NULL OR trim(_family_name) = '' THEN
    RAISE EXCEPTION 'Family name is required';
  END IF;

  -- If the user already is a parent somewhere, reuse that family instead of
  -- creating a duplicate (onboarding re-runs used to create several families).
  SELECT ur.family_id INTO _existing
  FROM public.user_roles ur
  WHERE ur.user_id = _user_id
    AND ur.role = 'parent'
    AND ur.family_id IS NOT NULL
  ORDER BY ur.created_at
  LIMIT 1;

  IF _existing IS NOT NULL THEN
    UPDATE public.families SET name = trim(_family_name) WHERE id = _existing;
    RETURN _existing;
  END IF;

  INSERT INTO public.families (name)
  VALUES (trim(_family_name))
  RETURNING id INTO _family_id;

  INSERT INTO public.user_roles (user_id, role, family_id)
  VALUES (_user_id, 'parent', _family_id);

  RETURN _family_id;
END;
$function$;