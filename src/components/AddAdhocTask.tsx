import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface AddAdhocTaskProps {
  onAdd: (title: string) => Promise<boolean>;
}

export function AddAdhocTask({ onAdd }: AddAdhocTaskProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    const success = await onAdd(title.trim());
    setLoading(false);

    if (success) {
      setTitle('');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full border-dashed border-2 text-muted-foreground hover:text-foreground hover:border-primary/50"
        >
          <Plus className="w-4 h-4 mr-2" />
          Lägg till extra uppgift
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lägg till extra uppgift</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="T.ex. Öva extra matte, Städa rummet..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={!title.trim() || loading}>
              {loading ? 'Lägger till...' : 'Lägg till'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
