import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useHolidayMode, type HolidayGoalType, GOAL_COLORS } from '@/hooks/useHolidayMode';
import { cn } from '@/lib/utils';

const EMOJIS = ['📖', '🎸', '🧮', '✏️', '🎨', '⚽', '🏊', '🧩', '🎹', '🌱', '⭐', '🏃'];

const TYPE_OPTIONS: { value: HolidayGoalType; label: string; hint: string; unit: string }[] = [
  { value: 'count_per_day', label: 'Antal per dag', hint: 'T.ex. sidor läst', unit: 'st' },
  { value: 'minutes_per_day', label: 'Minuter per dag', hint: 'T.ex. spela gitarr', unit: 'min' },
  { value: 'checkbox_per_day', label: 'Klart varje dag', hint: 'Bock om det är gjort', unit: '' },
  { value: 'total_for_holiday', label: 'Totalt på lovet', hint: 'T.ex. läs 200 sidor', unit: 'st' },
];

export function HolidayGoalEditor({ childId, disabled }: { childId: string; disabled?: boolean }) {
  const { goals, createGoal } = useHolidayMode(childId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('⭐');
  const [type, setType] = useState<HolidayGoalType>('count_per_day');
  const [target, setTarget] = useState<string>('10');

  const reset = () => {
    setName('');
    setEmoji('⭐');
    setType('count_per_day');
    setTarget('10');
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    const numericTarget = parseInt(target, 10);
    const isCheckbox = type === 'checkbox_per_day';
    const isTotal = type === 'total_for_holiday';

    const ok = await createGoal({
      name: name.trim(),
      emoji,
      type,
      daily_target: isCheckbox ? 1 : isTotal ? null : isNaN(numericTarget) ? 1 : numericTarget,
      total_target: isTotal ? (isNaN(numericTarget) ? 1 : numericTarget) : null,
      color: GOAL_COLORS[goals.length % GOAL_COLORS.length],
    });
    if (ok) {
      setOpen(false);
      reset();
    }
  };

  const reachedLimit = goals.length >= 3;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full border-dashed h-14 rounded-2xl"
          disabled={disabled || reachedLimit}
        >
          <Plus className="w-4 h-4 mr-2" />
          {reachedLimit ? 'Max 3 mål' : 'Lägg till lovmål'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nytt lovmål</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Vad vill du göra?</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="T.ex. Läsa eller Gitarr"
              maxLength={60}
            />
          </div>

          <div className="space-y-2">
            <Label>Emoji</Label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={cn(
                    'w-10 h-10 rounded-xl text-xl transition',
                    emoji === e ? 'bg-primary/20 ring-2 ring-primary' : 'bg-muted hover:bg-muted/70'
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Typ av mål</Label>
            <div className="grid grid-cols-1 gap-2">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={cn(
                    'text-left p-3 rounded-xl border-2 transition',
                    type === opt.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  )}
                >
                  <div className="font-medium text-sm">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">{opt.hint}</div>
                </button>
              ))}
            </div>
          </div>

          {type !== 'checkbox_per_day' && (
            <div className="space-y-2">
              <Label>
                {type === 'total_for_holiday' ? 'Mål totalt på lovet' : 'Mål per dag'}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">
                  {TYPE_OPTIONS.find(o => o.value === type)?.unit}
                </span>
              </div>
            </div>
          )}

          <Button onClick={handleCreate} disabled={!name.trim()} className="w-full">
            Skapa mål
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
