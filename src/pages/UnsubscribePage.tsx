import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MailX } from 'lucide-react';

/**
 * Unsubscribes are handled on the hosted unsubscribe page linked from the
 * footer of every email. This page only exists for old links.
 */
export default function UnsubscribePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <Helmet>
        <title>Avregistrera e-post | Läxhjälp</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <main className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <MailX className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Avregistrera e-post</h1>
        <p className="text-muted-foreground mb-6">
          Använd länken "Avregistrera" längst ner i något av våra mejl för att slippa fler
          utskick. Inloggning och lösenordsåterställning fungerar som vanligt.
        </p>
        <Button asChild className="w-full h-12 text-lg">
          <Link to="/">Tillbaka till Läxhjälp</Link>
        </Button>
      </main>
    </div>
  );
}
