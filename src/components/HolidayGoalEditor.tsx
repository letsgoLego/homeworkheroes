import { useEffect, useState } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useHolidayMode, type HolidayGoalType, type HolidayGoal, GOAL_COLORS } from '@/hooks/useHolidayMode';
import { cn } from '@/lib/utils';

const EMOJIS = ['📖', '🎸', '🧮', '✏️', '🎨', '⚽', '🏊', '🧩', '🎹', '🌱', '⭐', '🏃'];

const TYPE_OPTIONS: { value: HolidayGoalType; label: string; hint: string; unit: string }[] = [
  { value: 'count_per_day', label: 'Antal per dag', hint: 'T.ex. sidor läst', unit: 'st' },
  { value: 'minutes_per_day', label: 'Minuter per dag', hint: 'T.ex. spela gitarr', unit: 'min' },
  { value: 'checkbox_per_day', label: 'Klart varje dag', hint: 'Bock om det är gjort', unit: '' },
  { value: 'total_for_holiday', label: 'Totalt på lovet', hint: 'T.ex. läs 200 sidor', unit: 'st' },
];

interface Props {
  childId: string;
  disabled?: boolean;
  goal?: HolidayGoal;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

export function HolidayGoalEditor({ childId, disabled, goal, open: controlledOpen, onOpenChange, hideTrigger }: Props) {
  const { goals, createGoal, updateGoal } = useHolidayMode(childId);
  const isEdit = !!goal;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (o: boolean) => {
    onOpenChange?.(o);
    if (controlledOpen === undefined) setUncontrolledOpen(o);
  };

  const initialTarget = goal
    ? goal.type === 'total_for_holiday'
      ? String(goal.total_target ?? 1)
      : String(goal.daily_target ?? 1)
    : '10';

  const [name, setName] = useState(goal?.name ?? '');
  const [emoji, setEmoji] = useState(goal?.emoji ?? '⭐');
  const [color, setColor] = useState(goal?.color ?? GOAL_COLORS[0]);
  const [type, setType] = useState<HolidayGoalType>(goal?.type ?? 'count_per_day');
  const [target, setTarget] = useState<string>(initialTarget);

  // Re-sync if the goal prop changes (e.g. opening editor for a different goal)
  useEffect(() => {
    if (!open) return;
    if (goal) {
      setName(goal.name);
      setEmoji(goal.emoji);
      setColor(goal.color);
      setType(goal.type);
      setTarget(
        goal.type === 'total_for_holiday'
          ? String(goal.total_target ?? 1)
          : String(goal.daily_target ?? 1)
      );
    } else {
      setName('');
      setEmoji('⭐');
      setColor(GOAL_COLORS[goals.length % GOAL_COLORS.length]);
      setType('count_per_day');
      setTarget('10');
    }
  }, [open, goal?.id]);

  const handleSave = async () => {
    if (!name.trim()) return;
    const numericTarget = parseInt(target, 10);
    const isCheckbox = type === 'checkbox_per_day';
    const isTotal = type === 'total_for_holiday';
    const safeTarget = isNaN(numericTarget) ? 1 : Math.max(1, numericTarget);

    const payload = {
      name: name.trim(),
      emoji,
      type,
      daily_target: isCheckbox ? 1 : isTotal ? null : safeTarget,
      total_target: isTotal ? safeTarget : null,
      color,
    };

    const ok = isEdit
      ? await updateGoal(goal!.id, payload)
      : await createGoal(payload);
    if (ok) setOpen(false);
  };

  const reachedLimit = goals.length >= 3;
  const typeChanged = isEdit && goal!.type !== type;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && !isEdit && (
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
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Redigera lovmål' : 'Nytt lovmål'}</DialogTitle>
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
            <Label>Färg</Label>
            <div className="flex flex-wrap gap-2">
              {GOAL_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-9 h-9 rounded-full transition border-2',
                    color === c ? 'ring-2 ring-offset-2 ring-foreground border-background' : 'border-transparent'
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Välj färg ${c}`}
                />
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
            {typeChanged && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Du byter måltyp. Tidigare ifyllda värden behålls men kan se konstiga ut i historiken.
                </p>
              </div>
            )}
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

          <Button onClick={handleSave} disabled={!name.trim()} className="w-full">
            {isEdit ? 'Spara ändringar' : 'Skapa mål'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
