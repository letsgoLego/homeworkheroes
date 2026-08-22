import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { format, parseISO, startOfDay, eachDayOfInterval, isBefore } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Plus, X, CalendarCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useFamily } from '@/hooks/useFamily';
import { celebrateAssignment } from '@/lib/confetti';
import { track } from '@/lib/analytics';
import { SUBJECT_LABELS, SUBJECT_ICONS, Subject } from '@/types/homework';
import type { InboxHomework } from '@/hooks/queries/useHomeworkData';

interface PlanHomeworkSheetProps {
  homework: InboxHomework | null;
  onClose: () => void;
}

interface PlanRow {
  title: string;
  date: string | null;
}

export function PlanHomeworkSheet({ homework, onClose }: PlanHomeworkSheetProps) {
  const { planHomework } = useFamily();
  const [rows, setRows] = useState<PlanRow[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [initialisedFor, setInitialisedFor] = useState<string | null>(null);

  // Available days: today .. due date
  const days = useMemo(() => {
    if (!homework) return [];
    const today = startOfDay(new Date());
    const due = startOfDay(parseISO(homework.due_date));
    if (isBefore(due, today)) return [today];
    return eachDayOfInterval({ start: today, end: due });
  }, [homework]);

  // Initialise rows from parent's plan items
  if (homework && initialisedFor !== homework.id) {
    const base = homework.planItems.length > 0
      ? homework.planItems.map(item => ({ title: item.title, date: null }))
      : [{ title: homework.title, date: null }];
    setRows(base);
    setInitialisedFor(homework.id);
  }

  if (!homework) return null;

  const setRowDate = (index: number, date: string) => {
    setRows(prev => prev.map((r, i) => (i === index ? { ...r, date: r.date === date ? null : date } : r)));
  };

  const addRow = () => {
    const value = newTitle.trim();
    if (!value) return;
    setRows(prev => [...prev, { title: value, date: null }]);
    setNewTitle('');
  };

  const allPlanned = rows.length > 0 && rows.every(r => r.date);

  const handleSave = async () => {
    if (!allPlanned) {
      toast.error('Välj en dag för varje del');
      return;
    }
    setSaving(true);
    const ok = await planHomework(
      homework.id,
      rows.map(r => ({ title: r.title, date: r.date as string }))
    );
    setSaving(false);
    if (ok) {
      celebrateAssignment();
      track('homework_planned_by_child', { parts: rows.length });
      setInitialisedFor(null);
      onClose();
    }
  };

  return (
    <Dialog open={!!homework} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {SUBJECT_ICONS[homework.subject as Subject]} {homework.title}
          </DialogTitle>
          <DialogDescription>
            Deadline {format(parseISO(homework.due_date), 'EEEE d MMMM', { locale: sv })} – välj vilka dagar du gör vad.
          </DialogDescription>
        </DialogHeader>

        {homework.description && (
          <p className="text-sm text-muted-foreground bg-muted/50 rounded-xl p-3">{homework.description}</p>
        )}

        <div className="space-y-5 pt-2">
          {rows.map((row, i) => (
            <div key={`${row.title}-${i}`} className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="flex-1">{row.title}</Label>
                {rows.length > 1 && (
                  <button
                    type="button"
                    aria-label="Ta bort del"
                    onClick={() => setRows(prev => prev.filter((_, idx) => idx !== i))}
                    className="text-muted-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {days.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const selected = row.date === dateStr;
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => setRowDate(i, dateStr)}
                      className={cn(
                        'shrink-0 px-3 py-2 rounded-xl border-2 text-xs font-medium transition-colors',
                        selected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground'
                      )}
                    >
                      <span className="block">{format(day, 'EEE', { locale: sv })}</span>
                      <span className="block text-sm font-bold">{format(day, 'd/M')}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="space-y-2">
            <Label htmlFor="plan-new">Lägg till egen del</Label>
            <div className="flex gap-2">
              <Input
                id="plan-new"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addRow();
                  }
                }}
                placeholder="t.ex. Repetera glosor"
              />
              <Button type="button" variant="secondary" onClick={addRow} aria-label="Lägg till del">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving || !allPlanned} className="w-full" size="lg">
            <CalendarCheck className="w-4 h-4 mr-2" />
            {saving ? 'Sparar…' : 'Klart – planera!'}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            {SUBJECT_LABELS[homework.subject as Subject]} · {rows.filter(r => r.date).length}/{rows.length} delar planerade
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
