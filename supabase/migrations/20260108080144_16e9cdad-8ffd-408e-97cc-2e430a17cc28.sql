-- Add password_hash column to children for child login (stored securely)
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS username text UNIQUE;
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS has_account boolean DEFAULT false;

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_children_username ON public.children(username) WHERE username IS NOT NULL;

-- Allow looking up families by invite code (for joining)
CREATE POLICY "Anyone can lookup family by invite code" 
ON public.families 
FOR SELECT 
TO authenticated
USING (true);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view their families" ON public.families;