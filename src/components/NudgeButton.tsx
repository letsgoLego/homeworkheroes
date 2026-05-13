import { useState } from 'react';
import { motion } from 'framer-motion';
import { HandMetal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useNudge, type NudgeTone } from '@/hooks/useNudge';
import { cn } from '@/lib/utils';

interface NudgeButtonProps {
  childId: string;
  childName: string;
  hasAccount: boolean;
  disabled?: boolean;
  className?: string;
}

const TONES: { id: NudgeTone; label: string; emoji: string; preset: string }[] = [
  { id: 'snall', label: 'Snäll', emoji: '😊', preset: 'Hej älskling, kom ihåg läxan idag 💚' },
  { id: 'peppig', label: 'Peppig', emoji: '🚀', preset: 'Du fixar det här! 5 min så är du i mål 🔥' },
  { id: 'bestamd', label: 'Bestämd', emoji: '⏰', preset: 'Dags att börja med läxan nu, tack!' },
];

export function NudgeButton({ childId, childName, hasAccount, disabled, className }: NudgeButtonProps) {
  const [open, setOpen] = useState(false);
  const [tone, setTone] = useState<NudgeTone>('peppig');
  const [message, setMessage] = useState(TONES[1].preset);
  const { sendNudge, remaining, sending } = useNudge(childId);

  const noAccount = !hasAccount;
  const outOfPings = remaining <= 0;
  const isDisabled = disabled || noAccount || outOfPings;

  const tooltip = noAccount
    ? `${childName} behöver ett barnkonto för att kunna petas`
    : outOfPings
      ? 'Du har petat klart för idag (max 2/dag)'
      : `Peta ${childName} (${remaining} kvar idag)`;

  const pickTone = (t: NudgeTone) => {
    setTone(t);
    const preset = TONES.find(x => x.id === t)?.preset ?? '';
    setMessage(preset);
  };

  const handleSend = async () => {
    const finalTone: NudgeTone = TONES.find(t => t.preset === message.trim()) ? tone : 'custom';
    const ok = await sendNudge(finalTone, message.trim());
    if (ok) setOpen(false);
  };

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => !isDisabled && setOpen(true)}
        disabled={isDisabled}
        title={tooltip}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
          'bg-primary text-primary-foreground shadow-sm',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          className
        )}
      >
        <HandMetal className="w-3.5 h-3.5" />
        Peta
      </motion.button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Peta {childName} 🫵</DialogTitle>
            <DialogDescription>
              Skicka en push till {childName}s enhet. Du har {remaining} petning{remaining === 1 ? '' : 'ar'} kvar idag.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {TONES.map(t => (
                <button
                  key={t.id}
                  onClick={() => pickTone(t.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all',
                    tone === t.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-muted-foreground/40'
                  )}
                >
                  <span className="text-2xl">{t.emoji}</span>
                  <span className="text-xs font-medium">{t.label}</span>
                </button>
              ))}
            </div>

            <div>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 200))}
                placeholder="Skriv ett kort meddelande..."
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {message.length}/200
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>Avbryt</Button>
              <Button onClick={handleSend} disabled={sending || message.trim().length === 0}>
                {sending ? 'Skickar...' : 'Skicka petning'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
