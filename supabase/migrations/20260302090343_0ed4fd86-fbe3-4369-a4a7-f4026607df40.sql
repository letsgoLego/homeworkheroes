
-- Push subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth_key text NOT NULL,
  timezone text NOT NULL DEFAULT 'Europe/Stockholm',
  notify_new_homework boolean NOT NULL DEFAULT true,
  notify_unfinished boolean NOT NULL DEFAULT true,
  notify_reminder boolean NOT NULL DEFAULT true,
  last_homework_notify date,
  last_unfinished_notify date,
  last_reminder_notify date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own push subscriptions" ON public.push_subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own push subscriptions" ON public.push_subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own push subscriptions" ON public.push_subscriptions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own push subscriptions" ON public.push_subscriptions
  FOR DELETE USING (user_id = auth.uid());

-- App config table for VAPID keys (no user-facing RLS - only service role)
CREATE TABLE IF NOT EXISTS public.app_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
