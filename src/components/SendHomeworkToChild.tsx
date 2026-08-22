import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Subject, SUBJECT_LABELS, SUBJECT_ICONS, HomeworkType, HOMEWORK_TYPE_LABELS } from '@/types/homework';
import { useFamily } from '@/hooks/useFamily';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { Plus, X, Send } from 'lucide-react';
import { toast } from 'sonner';
import { track } from '@/lib/analytics';

interface SendHomeworkToChildProps {
  open: boolean;
  onClose: () => void;
}

const subjects: Subject[] = ['math', 'science', 'language', 'history', 'art', 'music', 'english', 'other'];

export function SendHomeworkToChild({ open, onClose }: SendHomeworkToChildProps) {
  const { children, activeChildId, sendHomeworkToChild } = useFamily();
  const [childId, setChildId] = useState<string | null>(activeChildId);
  const [subject, setSubject] = useState<Subject>('math');
  const [homeworkType, setHomeworkType] = useState<HomeworkType>('inlamning');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 5), 'yyyy-MM-dd'));
  const [items, setItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');
  const [saving, setSaving] = useState(false);

  const targetChildId = childId || activeChildId;

  const reset = () => {
    setTitle('');
    setDescription('');
    setItems([]);
    setNewItem('');
    setDueDate(format(addDays(new Date(), 5), 'yyyy-MM-dd'));
  };

  const addItem = () => {
    const value = newItem.trim();
    if (!value) return;
    setItems(prev => [...prev, value]);
    setNewItem('');
  };

  const handleSend = async () => {
    if (!targetChildId) {
      toast.error('Välj ett barn');
      return;
    }
    const finalTitle = title.trim() || SUBJECT_LABELS[subject];
    setSaving(true);
    const result = await sendHomeworkToChild({
      title: finalTitle,
      subject,
      description: description.trim() || undefined,
      dueDate,
      childId: targetChildId,
      homeworkType,
      items,
    });
    setSaving(false);
    if (result) {
      track('homework_sent_to_child', { subject, items: items.length });
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Skicka läxa till barnet 📥</DialogTitle>
          <DialogDescription>
            Du fyller i vad som ska göras – barnet planerar själv vilka dagar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Child */}
          {children.length > 1 && (
            <div className="space-y-2">
              <Label>Till vem?</Label>
              <div className="flex flex-wrap gap-2">
                {children.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setChildId(c.id)}
                    className={cn(
                      'px-3 py-2 rounded-xl border-2 text-sm font-medium transition-colors',
                      targetChildId === c.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground'
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label>Ämne</Label>
            <div className="grid grid-cols-4 gap-2">
              {subjects.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSubject(s)}
                  className={cn(
                    'py-2 rounded-xl border-2 text-xs font-medium transition-colors',
                    subject === s ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                  )}
                >
                  <span className="block text-base">{SUBJECT_ICONS[s]}</span>
                  {SUBJECT_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Typ</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['inlamning', 'forhor'] as HomeworkType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setHomeworkType(t)}
                  className={cn(
                    'py-2 rounded-xl border-2 text-sm font-medium transition-colors',
                    homeworkType === t ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                  )}
                >
                  {HOMEWORK_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="send-title">Vad är läxan?</Label>
            <Input
              id="send-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={`t.ex. ${SUBJECT_LABELS[subject]} kap 4`}
            />
          </div>

          {/* Due date */}
          <div className="space-y-2">
            <Label htmlFor="send-due">Deadline</Label>
            <Input
              id="send-due"
              type="date"
              value={dueDate}
              min={format(new Date(), 'yyyy-MM-dd')}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="send-desc">Meddelande (valfritt)</Label>
            <Textarea
              id="send-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Instruktioner till barnet…"
              rows={2}
            />
          </div>

          {/* Plan items */}
          <div className="space-y-2">
            <Label>Delmoment (valfritt)</Label>
            <p className="text-xs text-muted-foreground">
              Barnet fördelar dessa på dagar fram till deadline.
            </p>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-muted/50">
                  <span className="flex-1 text-sm">{item}</span>
                  <button
                    type="button"
                    aria-label="Ta bort delmoment"
                    onClick={() => setItems(prev => prev.filter((_, idx) => idx !== i))}
                    className="text-muted-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem();
                  }
                }}
                placeholder="t.ex. Läs s. 12–18"
              />
              <Button type="button" variant="secondary" onClick={addItem} aria-label="Lägg till delmoment">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Button onClick={handleSend} disabled={saving} className="w-full" size="lg">
            <Send className="w-4 h-4 mr-2" />
            {saving ? 'Skickar…' : 'Skicka till barnet'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
