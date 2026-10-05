import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import SeoNoIndex from '@/components/SeoNoIndex';
import { notifyOwner } from '@/components/PremiumOfferCard';
import { toast } from 'sonner';

const TOKEN_KEY = 'laxhjalp_offer_token';

export default function PremiumOfferPage() {
  const [params] = useSearchParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const token = params.get('token') || localStorage.getItem(TOKEN_KEY) || '';
  const [why, setWhy] = useState('');
  const [stuck, setStuck] = useState('');
  const [missing, setMissing] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (params.get('token')) localStorage.setItem(TOKEN_KEY, params.get('token')!); }, [params]);

  const hasAnswer = !!(why.trim() || stuck.trim() || missing.trim());

  const accept = async () => {
    setSaving(true);
    const { data, error } = await supabase.rpc('accept_premium_offer', {
      _token: token, _answers: { why: why.trim(), stuck: stuck.trim(), missing: missing.trim() },
    });
    setSaving(false);
    if (error) {
      const msg = error.message.includes('not_family_member') ? 'Erbjudandet hör till en annan familj. Logga in med kontot som fick mejlet.'
        : error.message.includes('invalid_token') ? 'Länken fungerar inte. Öppna den igen från mejlet.'
        : 'Något gick fel, försök igen.';
      toast.error(msg);
      return;
    }
    localStorage.removeItem(TOKEN_KEY);
    notifyOwner(`[Premiumerbjudande accepterat] Varför: ${why} | Fastnade: ${stuck} | Saknar: ${missing}`);
    const end = data ? new Date(data as string).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' }) : '';
    toast.success(`Premium är aktiverat${end ? ` till och med ${end}` : ''}. Tack!`);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <SeoNoIndex />
      <div className="mx-auto max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Gift className="w-10 h-10 text-primary mx-auto" />
          <h1 className="text-2xl font-bold">3 månader Premium – gratis</h1>
          <p className="text-muted-foreground">
            Inget kort behövs och inget förnyas automatiskt. Efter tre månader väljer ni själva om ni vill fortsätta.
            I utbyte vill vi gärna höra vad vi kan göra bättre.
          </p>
        </div>

        {!token ? (
          <p className="text-center text-sm text-muted-foreground">Öppna länken från mejlet för att aktivera erbjudandet.</p>
        ) : loading ? null : !user ? (
          <div className="space-y-3">
            <p className="text-sm text-center">Logga in först, så kommer du tillbaka hit och kan aktivera.</p>
            <Button asChild className="w-full"><Link to="/auth">Logga in</Link></Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="why">Vad fick dig att börja använda Läxhjälp?</Label>
              <Textarea id="why" value={why} onChange={(e) => setWhy(e.target.value)} rows={2} maxLength={1000} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="stuck">Var fastnade du, eller vad var krångligt?</Label>
              <Textarea id="stuck" value={stuck} onChange={(e) => setStuck(e.target.value)} rows={2} maxLength={1000} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="missing">Vad saknar du för att använda appen varje vecka?</Label>
              <Textarea id="missing" value={missing} onChange={(e) => setMissing(e.target.value)} rows={2} maxLength={1000} />
            </div>
            <p className="text-xs text-muted-foreground">Svara på minst en fråga. Under perioden ställer vi några korta frågor i appen.</p>
            <Button className="w-full" disabled={!hasAnswer || saving} onClick={accept}>Aktivera Premium</Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function PremiumOfferUnsubscribePage() {
  const [params] = useSearchParams();
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading');
  useEffect(() => {
    const t = params.get('token');
    if (!t) { setState('error'); return; }
    supabase.rpc('unsubscribe_premium_offer', { _token: t }).then(({ data, error }) => setState(error || !data ? 'error' : 'done'));
  }, [params]);
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <SeoNoIndex />
      <p className="text-center max-w-sm">
        {state === 'loading' && 'Ett ögonblick…'}
        {state === 'done' && 'Klart. Du får inga fler erbjudanden från oss. Ditt konto påverkas inte.'}
        {state === 'error' && 'Länken fungerar inte. Svara på mejlet så hjälper vi dig.'}
      </p>
    </div>
  );
}
