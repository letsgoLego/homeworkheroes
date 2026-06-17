import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Trash2, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { useHolidayMode, type HolidayGoal } from '@/hooks/useHolidayMode';
import { fireConfetti } from '@/lib/confetti';
import { cn } from '@/lib/utils';

interface Props {
  goal: HolidayGoal;
  childId: string;
}

export function HolidayGoalCard({ goal, childId }: Props) {
  const { getEntryValue, setEntryValue, deleteGoal, getEntriesForGoal } = useHolidayMode(childId);
  const today = format(new Date(), 'yyyy-MM-dd');

  const isTotal = goal.type === 'total_for_holiday';
  const isCheckbox = goal.type === 'checkbox_per_day';
  const isMinutes = goal.type === 'minutes_per_day';

  // For total: sum all entries. For others: today's value.
  const allEntries = getEntriesForGoal(goal.id);
  const todayValue = getEntryValue(goal.id, today);
  const totalValue = allEntries.reduce((acc, e) => acc + (e.value || 0), 0);

  const currentValue = isTotal ? totalValue : todayValue;
  const target = isTotal ? (goal.total_target ?? 1) : (goal.daily_target ?? 1);
  const percent = Math.min(100, target > 0 ? (currentValue / target) * 100 : 0);
  const reached = currentValue >= target;

  const [customInput, setCustomInput] = useState('');

  const handleAdd = async (delta: number) => {
    const prev = todayValue;
    const next = Math.max(0, prev + delta);
    await setEntryValue(goal.id, today, next);
    // Check if reached now (compute new percent)
    const newCurrent = isTotal ? totalValue - prev + next : next;
    if (newCurrent >= target && (isTotal ? totalValue : prev) < target) {
      fireConfetti();
      if ('vibrate' in navigator) navigator.vibrate(40);
    }
  };

  const handleSetCustom = async () => {
    const n = parseInt(customInput, 10);
    if (isNaN(n) || n < 0) return;
    await setEntryValue(goal.id, today, n);
    setCustomInput('');
  };

  const handleCheckbox = async () => {
    const next = todayValue > 0 ? 0 : 1;
    await setEntryValue(goal.id, today, next);
    if (next === 1) {
      fireConfetti();
      if ('vibrate' in navigator) navigator.vibrate(40);
    }
  };

  const quickButtons = isMinutes ? [5, 15, 30] : [1, 5, 10];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card shadow-card overflow-hidden border border-border"
    >
      {/* Header */}
      <div className="p-4 flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{ backgroundColor: `${goal.color}25` }}
          >
            {goal.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold truncate">{goal.name}</h3>
            <p className="text-xs text-muted-foreground">
              {isTotal && `Totalt mål: ${goal.total_target}`}
              {isCheckbox && 'Klart varje dag'}
              {isMinutes && `${goal.daily_target} min/dag`}
              {goal.type === 'count_per_day' && `${goal.daily_target} per dag`}
            </p>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Ta bort mål?</AlertDialogTitle>
              <AlertDialogDescription>
                Målet "{goal.name}" och dess historik döljs.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Avbryt</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteGoal(goal.id)}>
                Ta bort
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Progress bar */}
      <div className="px-4">
        <div className="flex items-end justify-between mb-1">
          <span className="text-2xl font-bold" style={{ color: goal.color }}>
            {isCheckbox ? (todayValue > 0 ? '✓' : '–') : currentValue}
            {!isCheckbox && (
              <span className="text-base text-muted-foreground font-normal">
                {' / '}{target}
              </span>
            )}
          </span>
          {reached && !isCheckbox && (
            <span className="text-xs font-bold text-success flex items-center gap-1">
              <Check className="w-3 h-3" /> Klart!
            </span>
          )}
        </div>
        <div className="h-4 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: goal.color }}
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 pt-3">
        {isCheckbox ? (
          <Button
            onClick={handleCheckbox}
            variant={todayValue > 0 ? 'default' : 'outline'}
            className={cn('w-full', todayValue > 0 && 'bg-success hover:bg-success/90')}
          >
            {todayValue > 0 ? '✓ Klart idag' : 'Markera som klart'}
          </Button>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              {quickButtons.map((n) => (
                <Button
                  key={n}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAdd(n)}
                  className="flex-1"
                >
                  <Plus className="w-3 h-3 mr-1" />{n}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Sätt totalt idag"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="h-9"
              />
              <Button size="sm" onClick={handleSetCustom} disabled={!customInput}>
                OK
              </Button>
            </div>
            {!isTotal && todayValue > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                Idag: {todayValue}{isMinutes ? ' min' : ''}
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
