import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Gift, MessageSquareHeart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

type Stage = 'check_2w' | 'check_6w' | 'check_11w' | 'final' | 'adhoc';

const DAY = 24 * 60 * 60 * 1000;

const STAGE_COPY: Record<Stage, { title: string; question: string; rating: boolean }> = {
  check_2w: { title: 'Hur har första veckorna gått?', question: 'Vad skulle göra Läxhjälp bättre för er?', rating: true },
  check_6w: { title: 'Halvvägs – hur fungerar det?', question: 'Finns det något som krånglar eller som ni saknar?', rating: true },
  check_11w: { title: 'Snart tre månader – hur har det varit?', question: 'Vad har varit mest värdefullt, och vad skulle ni ändra?', rating: true },
  final: { title: 'Gratisperioden tar snart slut', question: 'Vill ni fortsätta med Premium? Varför eller varför inte?', rating: false },
  adhoc: { title: 'Tyck till', question: 'Vad vill du berätta? Allt hjälper oss att bli bättre.', rating: false },
};

const snoozeKey = (stage: Stage) => `laxhjalp_offer_snooze_${stage}`;

export function PremiumOfferCard({ familyId }: { familyId: string | undefined }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [openStage, setOpenStage] = useState<Stage | null>(null);
  const [, force] = useState(0);

  const { data } = useQuery({
    queryKey: ['premium-offer', familyId],
    enabled: !!familyId && !!user,
    queryFn: async () => {
      const [offerRes, famRes, fbRes] = await Promise.all([
        supabase.from('premium_offers').select('token, accepted_at, unsubscribed_at').eq('family_id', familyId!).maybeSingle(),
        supabase.from('families').select('subscription_override, trial_ends_at').eq('id', familyId!).maybeSingle(),
        supabase.from('offer_feedback').select('stage').eq('family_id', familyId!),
      ]);
      return {
        offer: offerRes.data,
        family: famRes.data,
        stages: new Set((fbRes.data ?? []).map((r) => r.stage)),
      };
    },
  });

  if (!data?.offer) return null;
  const { offer, family, stages } = data;

  // Not yet accepted → invitation
  if (!offer.accepted_at) {
    if (offer.unsubscribed_at) return null;
    return (
      <section>
        <Card className="border-2 border-primary/30 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Gift className="w-6 h-6 text-primary shrink-0" />
              <div>
                <h3 className="font-bold">Testa Premium gratis i 3 månader</h3>
                <p className="text-sm text-muted-foreground">
                  Inget kort, förnyas inte automatiskt. Vi vill bara höra vad vi kan göra bättre.
                </p>
              </div>
            </div>
            <Button className="w-full" onClick={() => navigate(`/erbjudande?token=${offer.token}`)}>
              Ja tack, berätta mer
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  const endsAt = family?.subscription_override === 'trial' && family.trial_ends_at ? new Date(family.trial_ends_at) : null;
  if (!endsAt || endsAt < new Date()) return null;

  const daysIn = (Date.now() - new Date(offer.accepted_at).getTime()) / DAY;
  const daysLeft = (endsAt.getTime() - Date.now()) / DAY;
  const today = new Date().toISOString().slice(0, 10);
  const candidates: [Stage, boolean][] = [
    ['final', daysLeft <= 7],
    ['check_11w', daysIn >= 77],
    ['check_6w', daysIn >= 42],
    ['check_2w', daysIn >= 14],
  ];
  const due = candidates.find(([s, ok]) => ok && !stages.has(s) && localStorage.getItem(snoozeKey(s)) !== today)?.[0];

  return (
    <section>
      <Card className="border border-primary/20">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <MessageSquareHeart className="w-6 h-6 text-primary shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold">{due ? STAGE_COPY[due].title : 'Gratis Premium'}</h3>
              <p className="text-sm text-muted-foreground">
                Premium till och med {format(endsAt, 'd MMMM', { locale: sv })}. Din feedback formar appen.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {due ? (
              <>
                <Button className="flex-1" onClick={() => setOpenStage(due)}>Svara (1 min)</Button>
                <Button variant="ghost" onClick={() => { localStorage.setItem(snoozeKey(due), today); force((n) => n + 1); }}>
                  Senare
                </Button>
              </>
            ) : (
              <Button variant="outline" className="flex-1" onClick={() => setOpenStage('adhoc')}>Tyck till</Button>
            )}
          </div>
          {due === 'final' && (
            <Button variant="link" className="px-0" onClick={() => navigate('/family')}>Se hur du fortsätter med Premium</Button>
          )}
        </CardContent>
      </Card>
      {openStage && (
        <FeedbackDialog
          stage={openStage}
          familyId={familyId!}
          onClose={() => setOpenStage(null)}
          onSaved={() => { setOpenStage(null); qc.invalidateQueries({ queryKey: ['premium-offer', familyId] }); }}
        />
      )}
    </section>
  );
}

function FeedbackDialog({ stage, familyId, onClose, onSaved }: { stage: Stage; familyId: string; onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth();
  const copy = STAGE_COPY[stage];
  const [rating, setRating] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!user || (!text.trim() && rating === null)) return;
    setSaving(true);
    const { error } = await supabase.from('offer_feedback').insert({
      family_id: familyId, user_id: user.id, stage, rating, answers: { text: text.trim() },
    });
    setSaving(false);
    if (error) { toast.error('Kunde inte spara, försök igen'); return; }
    notifyOwner(`[Premium-feedback ${stage}]${rating ? ` Betyg ${rating}/5.` : ''} ${text.trim()}`);
    toast.success('Tack! Vi läser allt.');
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.question}</DialogDescription>
        </DialogHeader>
        {copy.rating && (
          <div className="flex justify-between gap-2" role="radiogroup" aria-label="Betyg 1 till 5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Button key={n} type="button" variant={rating === n ? 'default' : 'outline'} className="flex-1" onClick={() => setRating(n)} aria-label={`Betyg ${n}`}>
                {n}
              </Button>
            ))}
          </div>
        )}
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={2000} placeholder="Skriv fritt…" />
        <Button onClick={save} disabled={saving || (!text.trim() && rating === null)}>Skicka</Button>
      </DialogContent>
    </Dialog>
  );
}

export function notifyOwner(message: string) {
  if (message.trim().length < 3) return;
  supabase.functions.invoke('send-help-question', { body: { message: message.slice(0, 2000) } }).catch(() => {});
}
