import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const PENDING_INVITE_KEY = 'laxhjalp_pending_invite';

export function savePendingInvite(code: string) {
  try {
    localStorage.setItem(PENDING_INVITE_KEY, code.toLowerCase().trim());
  } catch {
    /* ignore */
  }
}

/**
 * Completes a family invite after sign-in. Google sign-in redirects away from
 * the join page, so the code is kept locally and redeemed here once a session exists.
 */
export function PendingInviteHandler() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const running = useRef(false);

  useEffect(() => {
    if (!user || running.current) return;
    let code: string | null = null;
    try {
      code = localStorage.getItem(PENDING_INVITE_KEY);
    } catch {
      return;
    }
    if (!code || !/^[a-f0-9]{8}$/.test(code)) return;
    running.current = true;

    (async () => {
      const { data: role } = await supabase
        .from('user_roles')
        .select('family_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (role?.family_id) {
        localStorage.removeItem(PENDING_INVITE_KEY);
        return;
      }
      const { error } = await supabase.rpc('join_family_with_invite_code', { _code: code! });
      localStorage.removeItem(PENDING_INVITE_KEY);
      if (error) {
        toast.error('Kunde inte gå med i familjen. Ange koden igen på Familj-sidan.');
        return;
      }
      toast.success('Du är nu med i familjen! 🎉');
      await queryClient.invalidateQueries();
      window.location.assign('/');
    })().finally(() => {
      running.current = false;
    });
  }, [user, queryClient]);

  return null;
}
