ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS platform text NOT NULL DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS device_token text;

ALTER TABLE public.push_subscriptions
  ALTER COLUMN endpoint DROP NOT NULL,
  ALTER COLUMN p256dh DROP NOT NULL,
  ALTER COLUMN auth_key DROP NOT NULL;

ALTER TABLE public.push_subscriptions
  ADD CONSTRAINT push_subscriptions_platform_check
  CHECK (platform IN ('web', 'ios', 'android'));

CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_user_device_token_idx
  ON public.push_subscriptions (user_id, device_token)
  WHERE device_token IS NOT NULL;