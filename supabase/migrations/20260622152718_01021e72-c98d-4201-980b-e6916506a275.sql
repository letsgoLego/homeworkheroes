-- 1. Performance indexes for the hottest queries
CREATE INDEX IF NOT EXISTS idx_study_tasks_homework_id
  ON public.study_tasks(homework_id);

CREATE INDEX IF NOT EXISTS idx_homework_child_id
  ON public.homework(child_id);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
  ON public.push_subscriptions(user_id);

-- 2. Fix mutable search_path on email queue helper functions
ALTER FUNCTION public.enqueue_email(text, jsonb)         SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint)         SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;

-- 3. Lock down SECURITY DEFINER functions to the roles that actually need them.
--    lookup_family_by_invite_code stays open to anon (used in pre-login invite flow).

REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb)             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint)             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_family_members(uuid)            FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.nudges_remaining_today(uuid)        FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_child_last_seen(uuid)        FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.join_family_with_invite_code(text)  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_family_with_role(text)       FROM PUBLIC, anon;

-- Ensure authenticated still has what it needs
GRANT EXECUTE ON FUNCTION public.get_family_members(uuid)            TO authenticated;
GRANT EXECUTE ON FUNCTION public.nudges_remaining_today(uuid)        TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_child_last_seen(uuid)        TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_family_with_invite_code(text)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_family_with_role(text)       TO authenticated;