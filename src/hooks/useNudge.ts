import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type NudgeTone = 'snall' | 'peppig' | 'bestamd' | 'custom';

const MAX_PER_DAY = 2;

export function useNudge(childId: string | null) {
  const [remaining, setRemaining] = useState<number>(MAX_PER_DAY);
  const [sending, setSending] = useState(false);

  const refreshRemaining = useCallback(async () => {
    if (!childId) return;
    const { data, error } = await supabase.rpc('nudges_remaining_today', { _child_id: childId });
    if (!error && typeof data === 'number') setRemaining(data);
  }, [childId]);

  useEffect(() => {
    refreshRemaining();
  }, [refreshRemaining]);

  const sendNudge = useCallback(async (tone: NudgeTone, message: string) => {
    if (!childId) return false;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('nudge-child', {
        body: { child_id: childId, tone, message },
      });
      if (error) {
        // Try to surface 429 message
        const ctx = (error as { context?: Response }).context;
        if (ctx) {
          try {
            const j = await ctx.json();
            if (j?.error === 'rate_limit_or_quiet_hours') {
              toast.error(j.message || 'Du har nått gränsen för petningar idag.');
              await refreshRemaining();
              return false;
            }
          } catch { /* noop */ }
        }
        toast.error('Kunde inte skicka petningen');
        return false;
      }
      if (data?.delivered) {
        toast.success('Petning skickad ✨');
      } else {
        toast.success('Petning sparad – men barnets enhet hade ingen aktiv push.');
      }
      await refreshRemaining();
      return true;
    } finally {
      setSending(false);
    }
  }, [childId, refreshRemaining]);

  return { sendNudge, remaining, sending, refreshRemaining };
}
