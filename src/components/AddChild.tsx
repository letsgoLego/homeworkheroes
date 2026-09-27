import { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFamily } from '@/hooks/useFamily';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ChildLoginSetup } from '@/components/ChildLoginSetup';
import type { Tables } from '@/integrations/supabase/types';

interface AddChildProps {
  open: boolean;
  onClose: () => void;
}

const colors = [
  '#2eb8a6', '#f97853', '#9b59b6', '#3498db', '#e6c229', '#27ae60', '#e74c3c', '#f39c12',
];

export function AddChild({ open, onClose }: AddChildProps) {
  const { addChild } = useFamily();
  const [name, setName] = useState('');
  const [color, setColor] = useState(colors[0]);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<Tables<'children'> | null>(null);

  const handleClose = () => {
    setName('');
    setColor(colors[0]);
    setCreated(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Ange ett namn');
      return;
    }
    setLoading(true);
    const result = await addChild(name.trim(), color);
    setLoading(false);
    if (result) setCreated(result);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-sm border-0 shadow-elevated">
        <DialogHeader>
          <p className="text-xs font-medium text-muted-foreground">Steg {created ? 2 : 1} av 2</p>
          <DialogTitle className="text-xl font-bold">
            {created ? `Hur ska ${created.name} logga in?` : 'Lägg till ett barn'}
          </DialogTitle>
          {created && (
            <DialogDescription>
              Med egen inloggning kan {created.name} se och bocka av sina läxor själv.
            </DialogDescription>
          )}
        </DialogHeader>

        {created ? (
          <ChildLoginSetup child={created} onDone={handleClose} onSkip={handleClose} />
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div>
              <Label htmlFor="childName" className="text-sm font-medium">Vad heter barnet?</Label>
              <Input
                id="childName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="t.ex. Emma"
                className="mt-1.5"
                autoFocus
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Välj en färg</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {colors.map((c) => (
                  <button
                    key={c}
                    aria-label={`Färg ${c}`}
                    onClick={() => setColor(c)}
                    className={cn(
                      'w-10 h-10 rounded-full transition-all',
                      color === c && 'ring-2 ring-offset-2 ring-foreground scale-110'
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <Button onClick={handleSubmit} disabled={!name.trim() || loading} className="w-full" size="lg">
              {loading ? 'Lägger till...' : 'Nästa: inloggning'}
            </Button>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
