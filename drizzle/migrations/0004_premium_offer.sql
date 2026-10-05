ALTER TABLE public.families ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

CREATE TABLE public.premium_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL UNIQUE REFERENCES public.families(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  recipient_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  accepted_at timestamptz,
  accepted_by uuid,
  unsubscribed_at timestamptz
);
GRANT SELECT ON public.premium_offers TO authenticated;
GRANT ALL ON public.premium_offers TO service_role;
ALTER TABLE public.premium_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Family members read own offer" ON public.premium_offers FOR SELECT TO authenticated
  USING (public.user_belongs_to_family(auth.uid(), family_id) OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.offer_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  stage text NOT NULL,
  rating integer,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.offer_feedback TO authenticated;
GRANT ALL ON public.offer_feedback TO service_role;
ALTER TABLE public.offer_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own family feedback or admin" ON public.offer_feedback FOR SELECT TO authenticated
  USING (public.user_belongs_to_family(auth.uid(), family_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Insert own feedback" ON public.offer_feedback FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.user_belongs_to_family(auth.uid(), family_id)
    AND stage IN ('check_2w','check_6w','check_11w','adhoc','final'));

-- Accept the offer: validates token, stores start feedback, grants 90 days once.
CREATE OR REPLACE FUNCTION public.accept_premium_offer(_token text, _answers jsonb)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.premium_offers; ends timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO o FROM premium_offers WHERE token = _token;
  IF o.id IS NULL THEN RAISE EXCEPTION 'invalid_token'; END IF;
  IF NOT user_belongs_to_family(auth.uid(), o.family_id) THEN RAISE EXCEPTION 'not_family_member'; END IF;
  IF o.accepted_at IS NOT NULL THEN
    SELECT trial_ends_at INTO ends FROM families WHERE id = o.family_id; RETURN ends;
  END IF;
  IF coalesce(length(trim(_answers->>'why')),0) + coalesce(length(trim(_answers->>'stuck')),0) + coalesce(length(trim(_answers->>'missing')),0) = 0 THEN
    RAISE EXCEPTION 'feedback_required';
  END IF;
  ends := now() + interval '90 days';
  UPDATE premium_offers SET accepted_at = now(), accepted_by = auth.uid() WHERE id = o.id;
  UPDATE families SET subscription_override = 'trial', trial_ends_at = ends WHERE id = o.family_id
    AND coalesce(subscription_override,'') <> 'gifted';
  INSERT INTO offer_feedback(family_id, user_id, stage, answers) VALUES (o.family_id, auth.uid(), 'start', _answers);
  RETURN ends;
END $$;

-- Admin: create offers for eligible families and list them.
CREATE OR REPLACE FUNCTION public.admin_prepare_premium_offers()
RETURNS TABLE(family_id uuid, family_name text, recipient_email text, token text, sent_at timestamptz, accepted_at timestamptz, unsubscribed_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
#variable_conflict use_column
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  INSERT INTO premium_offers(family_id, recipient_email)
  SELECT DISTINCT ON (e.email) e.fid, e.email FROM (
    SELECT f.id fid, u.email::text email, f.created_at,
      (SELECT count(*) FROM children c WHERE c.family_id = f.id) kids
    FROM families f
    JOIN user_roles r ON r.family_id = f.id AND r.role <> 'child'
    JOIN auth.users u ON u.id = r.user_id
    WHERE coalesce(f.subscription_override,'') NOT IN ('gifted','trial')
      AND coalesce(f.subscription_status,'free') NOT IN ('active')
      AND f.name NOT ILIKE '%nordblad%'
      AND u.email NOT ILIKE '%@laxhjalpen.child'
      AND NOT EXISTS (
        SELECT 1 FROM user_roles r2 JOIN families nf ON nf.id = r2.family_id
        WHERE r2.user_id IN (SELECT r3.user_id FROM user_roles r3 WHERE r3.family_id = f.id)
          AND (nf.name ILIKE '%nordblad%' OR nf.subscription_override = 'gifted'))
  ) e
  WHERE NOT EXISTS (SELECT 1 FROM premium_offers p WHERE p.recipient_email = e.email)
  ORDER BY e.email, e.kids DESC, e.created_at
  ON CONFLICT (family_id) DO NOTHING;
  RETURN QUERY SELECT p.family_id, f.name, p.recipient_email, p.token, p.sent_at, p.accepted_at, p.unsubscribed_at
    FROM premium_offers p JOIN families f ON f.id = p.family_id ORDER BY p.created_at;
END $$;

CREATE OR REPLACE FUNCTION public.admin_list_offer_feedback()
RETURNS TABLE(id uuid, family_name text, email text, stage text, rating integer, answers jsonb, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY SELECT o.id, f.name, u.email::text, o.stage, o.rating, o.answers, o.created_at
    FROM offer_feedback o JOIN families f ON f.id = o.family_id LEFT JOIN auth.users u ON u.id = o.user_id
    ORDER BY o.created_at DESC;
END $$;

-- Public unsubscribe by token.
CREATE OR REPLACE FUNCTION public.unsubscribe_premium_offer(_token text)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE premium_offers SET unsubscribed_at = coalesce(unsubscribed_at, now()) WHERE token = _token RETURNING true;
$$;
GRANT EXECUTE ON FUNCTION public.unsubscribe_premium_offer(text) TO anon, authenticated;