import { supabase } from '@/integrations/supabase/client';

/** Fire-and-forget: server verifies the step and sends each email at most once per family. */
export function triggerOnboardingEmail(step: 'child-added' | 'child-login' | 'homework') {
  supabase.functions.invoke('send-onboarding-email', { body: { step } }).catch(() => {});
}
