import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { STRIPE_PRICES, useSubscription } from '@/hooks/useSubscription';
import { Check, Crown, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const { createCheckout } = useSubscription();
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (priceId: string) => {
    setLoading(priceId);
    try {
      await createCheckout(priceId);
    } catch {
      toast.error('Kunde inte starta betalning');
    } finally {
      setLoading(null);
    }
  };

  const features = [
    'Obegränsat antal läxor per barn',
    'Alla ämnen och läxtyper',
    'Återkommande läxor',
    'Packlistor och påminnelser',
    'Statistik och streaks',
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-0 shadow-elevated">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Crown className="w-5 h-5 text-celebration" />
            Uppgradera till Premium
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Lås upp obegränsat antal läxor för hela familjen.
          </p>

          {/* Features list */}
          <div className="space-y-2">
            {features.map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-success flex-shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>

          {/* Price cards */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {/* Monthly */}
            <button
              onClick={() => handleCheckout(STRIPE_PRICES.monthly.priceId)}
              disabled={!!loading}
              className={cn(
                'relative p-4 rounded-2xl border-2 border-border bg-card text-left transition-all hover:border-primary/50',
                loading === STRIPE_PRICES.monthly.priceId && 'opacity-70'
              )}
            >
              <p className="text-sm font-medium text-muted-foreground">Månadsvis</p>
              <p className="text-2xl font-extrabold mt-1">39 kr</p>
              <p className="text-xs text-muted-foreground">/månad</p>
            </button>

            {/* Yearly - highlighted */}
            <button
              onClick={() => handleCheckout(STRIPE_PRICES.yearly.priceId)}
              disabled={!!loading}
              className={cn(
                'relative p-4 rounded-2xl border-2 border-primary bg-primary/5 text-left transition-all hover:bg-primary/10',
                loading === STRIPE_PRICES.yearly.priceId && 'opacity-70'
              )}
            >
              <div className="absolute -top-2.5 right-3 bg-celebration text-celebration-foreground text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Spara 2 mån
              </div>
              <p className="text-sm font-medium text-primary">Årsvis</p>
              <p className="text-2xl font-extrabold mt-1">399 kr</p>
              <p className="text-xs text-muted-foreground">/år</p>
            </button>
          </div>

          <p className="text-xs text-center text-muted-foreground pt-1">
            Avsluta när du vill. Inga dolda avgifter.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
