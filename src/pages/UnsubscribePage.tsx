import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { MailX, CheckCircle2, AlertCircle } from 'lucide-react';

type State = 'loading' | 'valid' | 'done' | 'invalid';

export default function UnsubscribePage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<State>('loading');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setState('invalid');
      return;
    }
    const validate = async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`;
        const res = await fetch(url, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setState('invalid');
          return;
        }
        setState(data?.already_unsubscribed ? 'done' : 'valid');
      } catch {
        setState('invalid');
      }
    };
    validate();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setSubmitting(true);
    const { error } = await supabase.functions.invoke('handle-email-unsubscribe', {
      body: { token },
    });
    setSubmitting(false);
    setState(error ? 'invalid' : 'done');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <Helmet>
        <title>Avregistrera e-post | Läxhjälp</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <main className="w-full max-w-sm text-center">
        {state === 'loading' && (
          <div className="w-8 h-8 mx-auto border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        )}

        {state === 'valid' && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <MailX className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Vill du avregistrera dig?</h1>
            <p className="text-muted-foreground mb-6">
              Du slutar få mejl från Läxhjälp. Inloggning och lösenordsåterställning fungerar som vanligt.
            </p>
            <Button onClick={confirm} disabled={submitting} className="w-full h-12 text-lg">
              {submitting ? 'Avregistrerar…' : 'Ja, avregistrera mig'}
            </Button>
          </>
        )}

        {state === 'done' && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Klart!</h1>
            <p className="text-muted-foreground">Du får inga fler mejl från Läxhjälp.</p>
          </>
        )}

        {state === 'invalid' && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Länken fungerar inte</h1>
            <p className="text-muted-foreground">
              Länken är ogiltig eller redan använd. Hör av dig om du behöver hjälp.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
