import { motion } from 'framer-motion';
import { Share2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { track } from '@/lib/analytics';

const SHARE_URL = 'https://laxhjalp.app';
const SHARE_TITLE = 'Läxhjälp';
const SHARE_TEXT =
  'Vi använder Läxhjälp för att planera läxor, aktiviteter och packlista – lugnare eftermiddagar helt enkelt. Testa!';

export function ShareAppButton() {
  const handleShare = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url: SHARE_URL });
        track('app_shared', { method: 'native' });
        return;
      }
      await navigator.clipboard.writeText(`${SHARE_TEXT} ${SHARE_URL}`);
      track('app_shared', { method: 'clipboard' });
      toast.success('Länk kopierad!');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(`${SHARE_TEXT} ${SHARE_URL}`);
        track('app_shared', { method: 'clipboard' });
        toast.success('Länk kopierad!');
      } catch {
        toast.error('Kunde inte dela just nu');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-card shadow-card border border-border"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
          <Heart className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h3 className="font-bold">Dela med en kompis</h3>
          <p className="text-sm text-muted-foreground">
            Tipsa kompisar och andra föräldrar om Läxhjälp
          </p>
        </div>
      </div>
      <Button onClick={handleShare} className="w-full" variant="outline">
        <Share2 className="w-4 h-4 mr-2" />
        Dela appen
      </Button>
    </motion.div>
  );
}
