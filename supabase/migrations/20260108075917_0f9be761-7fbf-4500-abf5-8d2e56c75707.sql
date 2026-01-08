-- Drop and recreate the families INSERT policy to allow authenticated users to create and immediately read their family
DROP POLICY IF EXISTS "Authenticated users can create families" ON public.families;
DROP POLICY IF EXISTS "Users can view their families" ON public.families;

-- Allow authenticated users to create families (keeping this simple - the user_roles entry will be added right after)
CREATE POLICY "Authenticated users can create families" 
ON public.families 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow users to view families they belong to OR families they just created (before user_roles is added)
CREATE POLICY "Users can view their families" 
ON public.families 
FOR SELECT 
TO authenticated
USING (
  user_belongs_to_family(auth.uid(), id) 
  OR 
  created_at > (now() - interval '10 seconds')
);