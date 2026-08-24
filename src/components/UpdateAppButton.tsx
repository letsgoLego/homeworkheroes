import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

/** Tvingar appen att hämta senaste versionen: rensar cache + service worker och laddar om. */
export function UpdateAppButton() {
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(async (r) => {
            try {
              await r.update();
            } catch {
              // ignorera
            }
            return r.unregister();
          })
        );
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      toast.success('Hämtar senaste versionen…');
    } catch {
      toast.error('Kunde inte rensa cachen — laddar om ändå');
    } finally {
      const url = new URL(window.location.href);
      url.searchParams.set('v', Date.now().toString());
      window.location.replace(url.toString());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-card shadow-card"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="font-bold">Uppdatera appen</h3>
          <p className="text-sm text-muted-foreground">
            Hämta senaste versionen om något ser gammalt ut
          </p>
        </div>
      </div>
      <Button
        onClick={handleUpdate}
        disabled={updating}
        variant="outline"
        className="w-full"
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${updating ? 'animate-spin' : ''}`} />
        {updating ? 'Uppdaterar…' : 'Uppdatera app'}
      </Button>
    </motion.div>
  );
}
