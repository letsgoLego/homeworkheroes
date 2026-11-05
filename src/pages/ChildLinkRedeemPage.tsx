import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

export default function ChildLinkRedeemPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const token = params.get('t');
    if (!token) { setFailed(true); return; }
    (async () => {
      const { data, error } = await supabase.functions.invoke('child-login-link', { body: { action: 'redeem', token } });
      if (error || !data?.tokenHash) { setFailed(true); return; }
      await supabase.auth.signOut({ scope: 'local' });
      const { error: vErr } = await supabase.auth.verifyOtp({ token_hash: data.tokenHash, type: 'magiclink' });
      if (vErr) { setFailed(true); return; }
      navigate('/', { replace: true });
    })();
  }, [params, navigate]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-sm text-center space-y-4">
        {failed ? (
          <>
            <p className="text-4xl">⏰</p>
            <h1 className="text-xl font-bold">Länken fungerar inte längre</h1>
            <p className="text-muted-foreground">Den har redan använts eller gått ut. Be en förälder visa en ny kod.</p>
            <Button asChild variant="outline"><Link to="/child-login">Logga in med användarnamn</Link></Button>
          </>
        ) : (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
            <p className="font-medium">Loggar in…</p>
          </>
        )}
      </div>
    </main>
  );
}
