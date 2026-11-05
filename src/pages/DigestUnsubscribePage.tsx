import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';

export default function DigestUnsubscribePage() {
  const [params] = useSearchParams();
  const [state, setState] = useState<'loading' | 'ok' | 'fail'>('loading');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setState('fail'); return; }
    supabase.rpc('unsubscribe_weekly_digest', { _token: token }).then(({ data, error }) =>
      setState(!error && data ? 'ok' : 'fail'));
  }, [params]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Helmet><meta name="robots" content="noindex" /></Helmet>
      <div className="max-w-sm text-center space-y-3">
        {state === 'loading' && <p>Ett ögonblick…</p>}
        {state === 'ok' && (<><h1 className="text-xl font-bold">Klart!</h1><p className="text-muted-foreground">Du får inte fler veckobrev från Läxhjälp.</p></>)}
        {state === 'fail' && (<><h1 className="text-xl font-bold">Något gick fel</h1><p className="text-muted-foreground">Länken verkar inte stämma. Svara på mejlet så hjälper vi dig.</p></>)}
        <Link to="/" className="text-primary underline text-sm">Till Läxhjälp</Link>
      </div>
    </main>
  );
}
