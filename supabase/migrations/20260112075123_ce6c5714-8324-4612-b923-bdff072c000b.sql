-- Fix 1: Add username validation trigger for children table
-- Using a trigger instead of CHECK constraint for better error messages and flexibility

CREATE OR REPLACE FUNCTION public.validate_username()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.username IS NOT NULL THEN
    -- Validate format: alphanumeric and underscore only, 3-20 characters
    IF NOT NEW.username ~ '^[a-zA-Z0-9_]{3,20}$' THEN
      RAISE EXCEPTION 'Invalid username format. Must be 3-20 characters, alphanumeric and underscores only.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for username validation
DROP TRIGGER IF EXISTS validate_username_trigger ON public.children;
CREATE TRIGGER validate_username_trigger
BEFORE INSERT OR UPDATE ON public.children
FOR EACH ROW EXECUTE FUNCTION public.validate_username();

-- Fix 2: Update lookup_family_by_invite_code to validate input format
CREATE OR REPLACE FUNCTION public.lookup_family_by_invite_code(code TEXT)
RETURNS TABLE (id UUID, name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate invite code format: must be exactly 8 lowercase hex characters
  IF code IS NULL OR code !~ '^[a-f0-9]{8}$' THEN
    RETURN; -- Return empty result for invalid codes
  END IF;
  
  RETURN QUERY
  SELECT f.id, f.name
  FROM public.families f
  WHERE f.invite_code = code
  LIMIT 1;
END;
$$;