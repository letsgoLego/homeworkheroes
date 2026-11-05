import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { Share2, Copy, Loader2, Smartphone } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { triggerOnboardingEmail } from '@/lib/onboardingEmail';

interface Props {
  child: { id: string; name: string } | null;
  onClose: () => void;
  onLinked?: () => void;
  onUsePassword?: () => void;
}

/** Parent shows a QR code / shares a link; the child's device signs in without a password. */
export function ChildDeviceLinkDialog({ child, onClose, onLinked, onUsePassword }: Props) {
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!child) return;
    setLink(null);
    setError(false);
    supabase.functions
      .invoke('child-login-link', { body: { action: 'create', childId: child.id } })
      .then(({ data, error }) => {
        if (error || !data?.token) { setError(true); return; }
        setLink(`${window.location.origin}/koppla?t=${encodeURIComponent(data.token)}`);
        onLinked?.();
        triggerOnboardingEmail('child-login');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [child?.id]);

  const share = async () => {
    if (!link || !child) return;
    if (navigator.share) {
      try { await navigator.share({ title: `Läxhjälp för ${child.name}`, text: `Öppna länken på din mobil eller iPad för att logga in i Läxhjälp:`, url: link }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(link);
      toast.success('Länken är kopierad');
    }
  };

  return (
    <Dialog open={!!child} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Smartphone className="w-5 h-5 text-primary" />Koppla {child?.name}s enhet</DialogTitle>
          <DialogDescription>
            Öppna kameran på barnets mobil eller iPad och rikta den mot koden. Då loggas barnet in direkt – inget lösenord behövs.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-2">
          {link ? (
            <div className="rounded-2xl bg-card p-4 border">
              <QRCodeSVG value={link} size={208} />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive text-center py-10">Kunde inte skapa koden. Försök igen om en stund.</p>
          ) : (
            <Loader2 className="w-8 h-8 animate-spin text-primary my-20" />
          )}
        </div>

        <div className="space-y-2">
          <Button className="w-full" onClick={share} disabled={!link}>
            {typeof navigator !== 'undefined' && 'share' in navigator ? <Share2 className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            Skicka länken (SMS, AirDrop…)
          </Button>
          <p className="text-xs text-muted-foreground text-center">Koden fungerar en gång och i 30 minuter.</p>
          {onUsePassword && (
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={onUsePassword}>
              Hellre användarnamn och lösenord
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
