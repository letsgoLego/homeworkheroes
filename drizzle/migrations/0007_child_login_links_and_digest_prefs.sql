CREATE TABLE public.child_login_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE,
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.child_login_links TO service_role;
ALTER TABLE public.child_login_links ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.digest_preferences (
  user_id uuid PRIMARY KEY,
  weekly_digest boolean NOT NULL DEFAULT true,
  unsub_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  last_sent_week text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.digest_preferences TO authenticated;
GRANT ALL ON public.digest_preferences TO service_role;
ALTER TABLE public.digest_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own digest prefs" ON public.digest_preferences FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.unsubscribe_weekly_digest(_token uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.digest_preferences SET weekly_digest = false WHERE unsub_token = _token;
  RETURN FOUND;
END $$;
GRANT EXECUTE ON FUNCTION public.unsubscribe_weekly_digest(uuid) TO anon, authenticated;