import { Share, PlusSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function isIosBrowserTab() {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true;
  return ios && !standalone;
}

/** iPhone/iPad only allow notifications for apps added to the home screen. */
export function IosInstallGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Lägg Läxhjälp på hemskärmen</DialogTitle>
          <DialogDescription>På iPhone och iPad fungerar påminnelser bara när appen ligger på hemskärmen. Det tar 10 sekunder:</DialogDescription>
        </DialogHeader>
        <ol className="space-y-4 py-2">
          <li className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Share className="w-5 h-5 text-primary" /></span>
            <span className="text-sm"><strong>1.</strong> Tryck på <strong>Dela</strong>-knappen längst ner (eller uppe till höger) i Safari.</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><PlusSquare className="w-5 h-5 text-primary" /></span>
            <span className="text-sm"><strong>2.</strong> Välj <strong>Lägg till på hemskärmen</strong>.</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-lg">🔔</span>
            <span className="text-sm"><strong>3.</strong> Öppna Läxhjälp från hemskärmen och tryck på <strong>Slå på påminnelser</strong> igen.</span>
          </li>
        </ol>
        <Button onClick={onClose} className="w-full">Okej, jag fixar det</Button>
      </DialogContent>
    </Dialog>
  );
}
