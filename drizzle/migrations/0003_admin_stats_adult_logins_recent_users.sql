CREATE OR REPLACE FUNCTION public.get_admin_stats()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  this_start date := date_trunc('month', now())::date;
  prev_start date := (date_trunc('month', now()) - interval '1 month')::date;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT jsonb_build_object(
    'totals', jsonb_build_object(
      'users', (SELECT count(*) FROM auth.users),
      'families', (SELECT count(*) FROM public.families),
      'children', (SELECT count(*) FROM public.children),
      'child_accounts', (SELECT count(*) FROM public.children WHERE has_account),
      'homework', (SELECT count(*) FROM public.homework),
      'completed_tasks', (SELECT count(*) FROM public.study_tasks WHERE completed)
    ),
    'this_month', jsonb_build_object(
      'users', (SELECT count(*) FROM auth.users WHERE created_at >= this_start),
      'families', (SELECT count(*) FROM public.families WHERE created_at >= this_start),
      'children', (SELECT count(*) FROM public.children WHERE created_at >= this_start),
      'homework', (SELECT count(*) FROM public.homework WHERE created_at >= this_start),
      'completed_tasks', (SELECT count(*) FROM public.study_tasks WHERE completed AND completed_at >= this_start),
      'logins', (SELECT count(*) FROM public.login_events WHERE created_at >= this_start)
    ),
    'prev_month', jsonb_build_object(
      'users', (SELECT count(*) FROM auth.users WHERE created_at >= prev_start AND created_at < this_start),
      'families', (SELECT count(*) FROM public.families WHERE created_at >= prev_start AND created_at < this_start),
      'children', (SELECT count(*) FROM public.children WHERE created_at >= prev_start AND created_at < this_start),
      'homework', (SELECT count(*) FROM public.homework WHERE created_at >= prev_start AND created_at < this_start),
      'completed_tasks', (SELECT count(*) FROM public.study_tasks WHERE completed AND completed_at >= prev_start AND completed_at < this_start),
      'logins', (SELECT count(*) FROM public.login_events WHERE created_at >= prev_start AND created_at < this_start)
    ),
    'active', jsonb_build_object(
      'users_7d', (SELECT count(*) FROM auth.users WHERE last_sign_in_at >= now() - interval '7 days'),
      'users_30d', (SELECT count(*) FROM auth.users WHERE last_sign_in_at >= now() - interval '30 days'),
      'users_prev_30d', (SELECT count(*) FROM auth.users WHERE last_sign_in_at >= now() - interval '60 days' AND last_sign_in_at < now() - interval '30 days'),
      'children_7d', (SELECT count(*) FROM public.children WHERE last_seen_at >= now() - interval '7 days'),
      'children_30d', (SELECT count(*) FROM public.children WHERE last_seen_at >= now() - interval '30 days')
    ),
    'months', (
      SELECT coalesce(jsonb_agg(m ORDER BY m->>'month'), '[]'::jsonb) FROM (
        SELECT jsonb_build_object(
          'month', to_char(g.m, 'YYYY-MM'),
          'families', (SELECT count(*) FROM public.families f WHERE f.created_at >= g.m AND f.created_at < g.m + interval '1 month'),
          'users', (SELECT count(*) FROM auth.users u WHERE u.created_at >= g.m AND u.created_at < g.m + interval '1 month'),
          'homework', (SELECT count(*) FROM public.homework h WHERE h.created_at >= g.m AND h.created_at < g.m + interval '1 month'),
          'logins', (SELECT count(*) FROM public.login_events l WHERE l.created_at >= g.m AND l.created_at < g.m + interval '1 month')
        ) AS m
        FROM generate_series(date_trunc('month', now()) - interval '5 months', date_trunc('month', now()), interval '1 month') AS g(m)
      ) s
    ),
    'recent_families', (
      SELECT coalesce(jsonb_agg(r ORDER BY r->>'created_at' DESC), '[]'::jsonb) FROM (
        SELECT jsonb_build_object(
          'id', f.id,
          'name', f.name,
          'created_at', f.created_at,
          'children', (SELECT count(*) FROM public.children c WHERE c.family_id = f.id),
          'child_accounts', (SELECT count(*) FROM public.children c WHERE c.family_id = f.id AND c.has_account),
          'homework', (SELECT count(*) FROM public.homework h JOIN public.children c ON c.id = h.child_id WHERE c.family_id = f.id),
          'last_child_seen', (SELECT max(c.last_seen_at) FROM public.children c WHERE c.family_id = f.id),
          'adults', (SELECT count(DISTINCT ur.user_id) FROM public.user_roles ur WHERE ur.family_id = f.id AND ur.role IN ('parent','admin')),
          'last_adult_login', (
            SELECT max(greatest(u.last_sign_in_at, (SELECT max(le.created_at) FROM public.login_events le WHERE le.user_id = u.id)))
            FROM public.user_roles ur JOIN auth.users u ON u.id = ur.user_id
            WHERE ur.family_id = f.id AND ur.role IN ('parent','admin')
          )
        ) AS r
        FROM public.families f
        ORDER BY f.created_at DESC
        LIMIT 10
      ) s
    ),
    'recent_users', (
      SELECT coalesce(jsonb_agg(r ORDER BY r->>'created_at' DESC), '[]'::jsonb) FROM (
        SELECT jsonb_build_object(
          'id', u.id,
          'email', u.email,
          'created_at', u.created_at,
          'last_sign_in_at', u.last_sign_in_at,
          'is_child', coalesce(u.email LIKE '%@laxhjalpen.child', false),
          'family_name', (SELECT f.name FROM public.user_roles ur JOIN public.families f ON f.id = ur.family_id WHERE ur.user_id = u.id ORDER BY ur.created_at LIMIT 1),
          'logins', (SELECT count(*) FROM public.login_events le WHERE le.user_id = u.id)
        ) AS r
        FROM auth.users u
        ORDER BY u.created_at DESC
        LIMIT 10
      ) s
    )
  ) INTO result;

  RETURN result;
END;
$function$;