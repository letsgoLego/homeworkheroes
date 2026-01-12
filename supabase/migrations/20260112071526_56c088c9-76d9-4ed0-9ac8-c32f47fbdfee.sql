-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can lookup family by invite code" ON public.families;

-- Create a restricted policy that only allows users to view families they belong to
CREATE POLICY "Users can view their families" 
ON public.families 
FOR SELECT 
TO authenticated
USING (
  user_belongs_to_family(auth.uid(), id)
);

-- Create a secure SECURITY DEFINER function for invite code lookup
-- This allows looking up a family by invite code without exposing all families
CREATE OR REPLACE FUNCTION public.lookup_family_by_invite_code(code TEXT)
RETURNS TABLE (id UUID, name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT f.id, f.name
  FROM public.families f
  WHERE f.invite_code = code
  LIMIT 1;
END;
$$;