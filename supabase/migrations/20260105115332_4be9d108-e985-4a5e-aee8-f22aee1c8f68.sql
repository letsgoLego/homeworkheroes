-- Create families table
CREATE TABLE public.families (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(4), 'hex'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create children table
CREATE TABLE public.children (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#2eb8a6',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table for role management
CREATE TYPE public.app_role AS ENUM ('parent', 'child');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  child_id UUID REFERENCES public.children(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, family_id)
);

-- Create homework table
CREATE TABLE public.homework (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT 'other',
  description TEXT,
  due_date DATE NOT NULL,
  bring_to_school TEXT[],
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  needs_more_practice BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create study_tasks table
CREATE TABLE public.study_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  homework_id UUID NOT NULL REFERENCES public.homework(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  task_date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_tasks ENABLE ROW LEVEL SECURITY;

-- Security definer function to check family membership
CREATE OR REPLACE FUNCTION public.user_belongs_to_family(_user_id UUID, _family_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND family_id = _family_id
  )
$$;

-- Security definer function to check if user has a role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for families
CREATE POLICY "Users can view their families"
  ON public.families FOR SELECT
  USING (public.user_belongs_to_family(auth.uid(), id));

CREATE POLICY "Authenticated users can create families"
  ON public.families FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Family members can update their family"
  ON public.families FOR UPDATE
  USING (public.user_belongs_to_family(auth.uid(), id));

-- RLS Policies for children
CREATE POLICY "Family members can view children"
  ON public.children FOR SELECT
  USING (public.user_belongs_to_family(auth.uid(), family_id));

CREATE POLICY "Family members can create children"
  ON public.children FOR INSERT
  TO authenticated
  WITH CHECK (public.user_belongs_to_family(auth.uid(), family_id));

CREATE POLICY "Family members can update children"
  ON public.children FOR UPDATE
  USING (public.user_belongs_to_family(auth.uid(), family_id));

CREATE POLICY "Family members can delete children"
  ON public.children FOR DELETE
  USING (public.user_belongs_to_family(auth.uid(), family_id));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid() OR public.user_belongs_to_family(auth.uid(), family_id));

CREATE POLICY "Authenticated users can insert their roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for homework
CREATE POLICY "Family members can view homework"
  ON public.homework FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.children c
    WHERE c.id = homework.child_id
    AND public.user_belongs_to_family(auth.uid(), c.family_id)
  ));

CREATE POLICY "Family members can create homework"
  ON public.homework FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.children c
    WHERE c.id = homework.child_id
    AND public.user_belongs_to_family(auth.uid(), c.family_id)
  ));

CREATE POLICY "Family members can update homework"
  ON public.homework FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.children c
    WHERE c.id = homework.child_id
    AND public.user_belongs_to_family(auth.uid(), c.family_id)
  ));

CREATE POLICY "Family members can delete homework"
  ON public.homework FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.children c
    WHERE c.id = homework.child_id
    AND public.user_belongs_to_family(auth.uid(), c.family_id)
  ));

-- RLS Policies for study_tasks
CREATE POLICY "Family members can view study tasks"
  ON public.study_tasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.homework h
    JOIN public.children c ON c.id = h.child_id
    WHERE h.id = study_tasks.homework_id
    AND public.user_belongs_to_family(auth.uid(), c.family_id)
  ));

CREATE POLICY "Family members can create study tasks"
  ON public.study_tasks FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.homework h
    JOIN public.children c ON c.id = h.child_id
    WHERE h.id = study_tasks.homework_id
    AND public.user_belongs_to_family(auth.uid(), c.family_id)
  ));

CREATE POLICY "Family members can update study tasks"
  ON public.study_tasks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.homework h
    JOIN public.children c ON c.id = h.child_id
    WHERE h.id = study_tasks.homework_id
    AND public.user_belongs_to_family(auth.uid(), c.family_id)
  ));

CREATE POLICY "Family members can delete study tasks"
  ON public.study_tasks FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.homework h
    JOIN public.children c ON c.id = h.child_id
    WHERE h.id = study_tasks.homework_id
    AND public.user_belongs_to_family(auth.uid(), c.family_id)
  ));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_homework_updated_at
  BEFORE UPDATE ON public.homework
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.homework;
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.children;