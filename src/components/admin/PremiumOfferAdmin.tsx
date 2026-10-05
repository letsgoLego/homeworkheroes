import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { sv } from 'date-fns/locale';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const STAGE_LABEL: Record<string, string> = {
  start: 'Start', check_2w: '2 veckor', check_6w: '6 veckor', check_11w: '11 veckor', final: 'Slut', adhoc: 'Tyck till',
};

export function PremiumOfferAdmin() {
  const qc = useQueryClient();
  const [sending, setSending] = useState(false);

  const { data: offers } = useQuery({
    queryKey: ['admin-premium-offers'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_prepare_premium_offers');
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: feedback } = useQuery({
    queryKey: ['admin-offer-feedback'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_offer_feedback');
      if (error) throw error;
      return data ?? [];
    },
  });

  const pending = (offers ?? []).filter((o) => !o.sent_at && !o.accepted_at && !o.unsubscribed_at);
  const sent = (offers ?? []).filter((o) => o.sent_at).length;
  const accepted = (offers ?? []).filter((o) => o.accepted_at).length;
  const unsub = (offers ?? []).filter((o) => o.unsubscribed_at).length;

  const send = async () => {
    if (!confirm(`Skicka erbjudandet till ${pending.length} familjer?`)) return;
    setSending(true);
    const { data, error } = await supabase.functions.invoke('send-premium-offer', { body: {} });
    setSending(false);
    if (error) {
      const details = error instanceof FunctionsHttpError ? await error.context.text() : error.message;
      toast.error(`Utskicket misslyckades: ${details}`);
      return;
    }
    if (data?.failed?.length) {
      const f = data.failed[0];
      toast.error(`${data.sent} skickade, ${data.failed.length} misslyckades (${f.status}): ${String(f.details).slice(0, 160)}`);
    } else {
      toast.success(`${data?.sent ?? 0} mejl skickade`);
    }
    qc.invalidateQueries({ queryKey: ['admin-premium-offers'] });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Premiumerbjudande</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2 text-center text-sm">
          <div><div className="text-xl font-bold">{pending.length}</div>Att skicka</div>
          <div><div className="text-xl font-bold">{sent}</div>Skickade</div>
          <div><div className="text-xl font-bold">{accepted}</div>Aktiverade</div>
          <div><div className="text-xl font-bold">{unsub}</div>Avregistrerade</div>
        </div>

        <div className="space-y-2">
          {(offers ?? []).map((o) => (
            <div key={o.family_id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2 text-sm">
              <div className="min-w-0">
                <div className="font-medium truncate">{o.family_name}</div>
                <div className="text-xs text-muted-foreground truncate">{o.recipient_email}</div>
              </div>
              <Badge variant={o.accepted_at ? 'default' : 'secondary'}>
                {o.accepted_at ? 'Aktiverad' : o.unsubscribed_at ? 'Avregistrerad' : o.sent_at ? 'Skickad' : 'Ej skickad'}
              </Badge>
            </div>
          ))}
        </div>

        <Button className="w-full" disabled={!pending.length || sending} onClick={send}>
          {sending ? 'Skickar…' : `Skicka erbjudandet (${pending.length})`}
        </Button>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Feedback</h3>
          {!feedback?.length && <p className="text-sm text-muted-foreground">Inga svar än.</p>}
          {feedback?.map((f) => {
            const a = (f.answers ?? {}) as Record<string, string>;
            return (
              <div key={f.id} className="rounded-lg border border-border p-3 text-sm space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{f.family_name} · {f.email} · {STAGE_LABEL[f.stage] ?? f.stage}{f.rating ? ` · ${f.rating}/5` : ''}</span>
                  <span>{format(parseISO(f.created_at), 'd MMM', { locale: sv })}</span>
                </div>
                {a.why && <p><strong>Varför:</strong> {a.why}</p>}
                {a.stuck && <p><strong>Fastnade:</strong> {a.stuck}</p>}
                {a.missing && <p><strong>Saknar:</strong> {a.missing}</p>}
                {a.text && <p>{a.text}</p>}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
