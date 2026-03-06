
-- Add blocked column to user_roles
ALTER TABLE public.user_roles ADD COLUMN blocked boolean NOT NULL DEFAULT false;

-- Allow parents to update roles in their family (but not their own)
CREATE POLICY "Parents can update family roles"
ON public.user_roles FOR UPDATE
USING (
  public.has_role(auth.uid(), 'parent')
  AND public.user_belongs_to_family(auth.uid(), family_id)
  AND user_id != auth.uid()
)
WITH CHECK (
  public.has_role(auth.uid(), 'parent')
  AND public.user_belongs_to_family(auth.uid(), family_id)
  AND user_id != auth.uid()
);

-- Allow parents to delete family roles (but not their own)
CREATE POLICY "Parents can delete family roles"
ON public.user_roles FOR DELETE
USING (
  public.has_role(auth.uid(), 'parent')
  AND public.user_belongs_to_family(auth.uid(), family_id)
  AND user_id != auth.uid()
);

-- Function to get family members with email from auth.users
CREATE OR REPLACE FUNCTION public.get_family_members(_family_id uuid)
RETURNS TABLE(
  user_id uuid,
  email text,
  role app_role,
  child_id uuid,
  blocked boolean,
  child_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ur.user_id,
    au.email::text,
    ur.role,
    ur.child_id,
    ur.blocked,
    c.name as child_name
  FROM public.user_roles ur
  JOIN auth.users au ON au.id = ur.user_id
  LEFT JOIN public.children c ON c.id = ur.child_id
  WHERE ur.family_id = _family_id
  AND public.user_belongs_to_family(auth.uid(), _family_id)
$$;
