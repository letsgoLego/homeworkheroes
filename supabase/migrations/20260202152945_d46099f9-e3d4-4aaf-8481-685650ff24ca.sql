-- Add homework_type column to homework table (inlamning = submission, forhor = oral exam/test)
ALTER TABLE public.homework
ADD COLUMN homework_type text NOT NULL DEFAULT 'inlamning';

-- Create table for recurring pack items (not tied to specific homework)
CREATE TABLE public.recurring_pack_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  weekdays integer[] NOT NULL DEFAULT '{}', -- Array of weekday numbers (0=Sunday, 1=Monday, etc.)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on recurring_pack_items
ALTER TABLE public.recurring_pack_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for recurring_pack_items
CREATE POLICY "Family members can view recurring pack items" 
ON public.recurring_pack_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM children c
  WHERE c.id = recurring_pack_items.child_id 
  AND user_belongs_to_family(auth.uid(), c.family_id)
));

CREATE POLICY "Family members can create recurring pack items" 
ON public.recurring_pack_items 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM children c
  WHERE c.id = recurring_pack_items.child_id 
  AND user_belongs_to_family(auth.uid(), c.family_id)
));

CREATE POLICY "Family members can update recurring pack items" 
ON public.recurring_pack_items 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM children c
  WHERE c.id = recurring_pack_items.child_id 
  AND user_belongs_to_family(auth.uid(), c.family_id)
));

CREATE POLICY "Family members can delete recurring pack items" 
ON public.recurring_pack_items 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM children c
  WHERE c.id = recurring_pack_items.child_id 
  AND user_belongs_to_family(auth.uid(), c.family_id)
));

-- Create index for efficient querying
CREATE INDEX idx_recurring_pack_items_child ON public.recurring_pack_items(child_id);
CREATE INDEX idx_recurring_pack_items_weekdays ON public.recurring_pack_items USING GIN(weekdays);