-- Create a SECURITY DEFINER function that atomically creates a family and adds the user as a parent
-- This prevents any race condition or timing vulnerability where the family is visible before the user_role is created

CREATE OR REPLACE FUNCTION public.create_family_with_role(
  _family_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _family_id uuid;
BEGIN
  -- Get the current user
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Validate family name
  IF _family_name IS NULL OR trim(_family_name) = '' THEN
    RAISE EXCEPTION 'Family name is required';
  END IF;
  
  -- Create the family
  INSERT INTO public.families (name)
  VALUES (trim(_family_name))
  RETURNING id INTO _family_id;
  
  -- Add the user as a parent in the same transaction
  INSERT INTO public.user_roles (user_id, role, family_id)
  VALUES (_user_id, 'parent', _family_id);
  
  -- Return the family ID
  RETURN _family_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_family_with_role(text) TO authenticated;