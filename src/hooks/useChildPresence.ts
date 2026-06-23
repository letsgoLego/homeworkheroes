import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type PresenceStatus = 'online' | 'today' | 'stale' | 'unknown';

export function presenceStatus(lastSeenAt: string | null | undefined, hasAccount: boolean): PresenceStatus {
  if (!hasAccount) return 'unknown';
  if (!lastSeenAt) return 'stale';
  const last = new Date(lastSeenAt).getTime();
  const now = Date.now();
  const diffMs = now - last;
  const FOUR_HOURS = 4 * 60 * 60 * 1000;
  if (diffMs <= FOUR_HOURS) return 'online';
  // "today" if same calendar day in local time
  const lastDate = new Date(last);
  const nowDate = new Date(now);
  if (
    lastDate.getFullYear() === nowDate.getFullYear() &&
    lastDate.getMonth() === nowDate.getMonth() &&
    lastDate.getDate() === nowDate.getDate()
  ) return 'today';
  return 'stale';
}

export const PRESENCE_LABEL: Record<PresenceStatus, string> = {
  online: 'Aktiv nu',
  today: 'Aktiv idag',
  stale: 'Inte aktiv idag',
  unknown: 'Inget barnkonto',
};

export const PRESENCE_COLOR: Record<PresenceStatus, string> = {
  online: 'bg-success',
  today: 'bg-celebration',
  stale: 'bg-destructive',
  unknown: 'bg-muted-foreground/40',
};

const HEARTBEAT_KEY = 'laxhjalpen_last_heartbeat';
const HEARTBEAT_THROTTLE_MS = 5 * 60 * 1000; // 5 min

/**
 * Heartbeat: when a child account is active, ping their last_seen_at
 * at most once every 5 minutes per session.
 */
export function useChildHeartbeat(childId: string | null, isChildAccount: boolean) {
  useEffect(() => {
    if (!childId || !isChildAccount) return;
    const ping = async () => {
      const last = Number(localStorage.getItem(HEARTBEAT_KEY) || '0');
      if (Date.now() - last < HEARTBEAT_THROTTLE_MS) return;
      const { error } = await supabase.rpc('update_child_last_seen', { _child_id: childId });
      if (!error) localStorage.setItem(HEARTBEAT_KEY, String(Date.now()));
    };
    ping();
    const onVisible = () => { if (document.visibilityState === 'visible') ping(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [childId, isChildAccount]);
}
