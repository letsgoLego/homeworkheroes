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