import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Trash2, Plus, Check, Flame, Pencil, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { useHolidayMode, type HolidayGoal } from '@/hooks/useHolidayMode';
import { HolidayGoalEditor } from './HolidayGoalEditor';
import { celebrateTask, celebrateStars, haptic } from '@/lib/confetti';
import { cn } from '@/lib/utils';

interface Props {
  goal: HolidayGoal;
  childId: string;
}

const MILESTONES = [25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

export function HolidayGoalCard({ goal, childId }: Props) {
  const {
    getEntryValue, setEntryValue, deleteGoal, getEntriesForGoal,
    getGoalStreak, getLast7Days,
  } = useHolidayMode(childId);
  const today = format(new Date(), 'yyyy-MM-dd');

  const isTotal = goal.type === 'total_for_holiday';
  const isCheckbox = goal.type === 'checkbox_per_day';
  const isMinutes = goal.type === 'minutes_per_day';

  const allEntries = getEntriesForGoal(goal.id);
  const todayValue = getEntryValue(goal.id, today);
  const totalValue = allEntries.reduce((acc, e) => acc + (e.value || 0), 0);

  const currentValue = isTotal ? totalValue : todayValue;
  const target = isTotal ? (goal.total_target ?? 1) : (goal.daily_target ?? 1);
  const percent = Math.min(100, target > 0 ? (currentValue / target) * 100 : 0);
  const reached = currentValue >= target;
  const streak = getGoalStreak(goal.id);
  const last7 = getLast7Days(goal.id);
  const max7 = Math.max(target, ...last7.map(d => d.value), 1);

  const [customInput, setCustomInput] = useState('');
  const [editOpen, setEditOpen] = useState(false);

  const checkMilestone = (prevTotal: number, nextTotal: number) => {
    const crossed = MILESTONES.find(m => prevTotal < m && nextTotal >= m);
    if (crossed) {
      const unit = isMinutes ? 'minuter' : isCheckbox ? 'gånger' : '';
      celebrateStars();
      haptic('heavy');
      toast.success(`🎉 ${crossed} ${unit} totalt med ${goal.name}!`, { duration: 4000 });
    }
  };

  const checkDouble = (prev: number, next: number) => {
    // Trigger when crossing 2x target today, once per day per goal
    if (isCheckbox || isTotal) return;
    if (prev >= target * 2 || next < target * 2) return;
    const key = `holiday-double-${childId}-${goal.id}-${today}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    celebrateStars();
    haptic('medium');
    toast.success(`🔥 Dubbelt upp – ${next}${isMinutes ? ' min' : ''} ${goal.name}!`, { duration: 3500 });
  };

  const handleAdd = async (delta: number) => {
    const prev = todayValue;
    const next = Math.max(0, prev + delta);
    const prevTotal = totalValue;
    const nextTotal = totalValue - prev + next;
    await setEntryValue(goal.id, today, next);
    const justReached = isTotal
      ? nextTotal >= target && prevTotal < target
      : next >= target && prev < target;
    if (justReached) {
      celebrateTask();
      haptic('medium');
      if (!isTotal) {
        toast.success('🎯 Dagsmål klart! Fortsätt gärna.', { duration: 3000 });
      }
    }
    checkDouble(prev, next);
    checkMilestone(prevTotal, nextTotal);
  };

  const handleSetCustom = async () => {
    const n = parseInt(customInput, 10);
    if (isNaN(n) || n < 0) return;
    const prev = todayValue;
    const prevTotal = totalValue;
    const nextTotal = totalValue - todayValue + n;
    await setEntryValue(goal.id, today, n);
    setCustomInput('');
    const justReached = isTotal
      ? nextTotal >= target && prevTotal < target
      : n >= target && prev < target;
    if (justReached) {
      celebrateTask();
      haptic('medium');
      if (!isTotal) toast.success('🎯 Dagsmål klart! Fortsätt gärna.', { duration: 3000 });
    }
    checkDouble(prev, n);
    checkMilestone(prevTotal, nextTotal);
  };

  const handleCheckbox = async () => {
    const next = todayValue > 0 ? 0 : 1;
    await setEntryValue(goal.id, today, next);
    if (next === 1) {
      celebrateTask();
      haptic('medium');
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
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold truncate">{goal.name}</h3>
              {streak > 0 && (
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-600"
                  title={`${streak} dagar i rad`}
                >
                  <Flame className="w-3 h-3" />{streak}
                </span>
              )}
              {isTotal && reached && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-success/15 text-success">
                  <Trophy className="w-3 h-3" /> Mål uppnått
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isTotal && `Totalt mål: ${goal.total_target}`}
              {isCheckbox && 'Klart varje dag'}
              {isMinutes && `${goal.daily_target} min/dag`}
              {goal.type === 'count_per_day' && `${goal.daily_target} per dag`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={() => setEditOpen(true)}
            aria-label="Redigera mål"
          >
            <Pencil className="w-4 h-4" />
          </Button>
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
      </div>

      <HolidayGoalEditor
        childId={childId}
        goal={goal}
        open={editOpen}
        onOpenChange={setEditOpen}
        hideTrigger
      />


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
              <Check className="w-3 h-3" />
              {currentValue > target ? `+${currentValue - target} över målet!` : 'Klart!'}
            </span>
          )}
        </div>
        <div className="h-4 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: reached && !isCheckbox
                ? `linear-gradient(90deg, ${goal.color}, hsl(var(--success)))`
                : goal.color,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          />
        </div>
      </div>

      {/* 7-day mini history */}
      <div className="px-4 pt-3">
        <div className="flex items-end gap-1.5 h-12">
          {last7.map((d, i) => {
            const isToday = d.dateStr === today;
            const hit = isCheckbox || isTotal ? d.value > 0 : d.value >= target;
            const h = isCheckbox
              ? (d.value > 0 ? 100 : 12)
              : Math.max(12, (d.value / max7) * 100);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex-1 flex items-end">
                  <motion.div
                    className={cn('w-full rounded-sm', isToday && 'ring-2 ring-offset-1 ring-offset-card')}
                    style={{
                      height: `${h}%`,
                      backgroundColor: d.value > 0 ? (hit ? goal.color : `${goal.color}80`) : 'hsl(var(--muted))',
                      // @ts-ignore
                      '--tw-ring-color': goal.color,
                    }}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: i * 0.04, type: 'spring', stiffness: 120, damping: 16 }}
                  />
                </div>
                <span className={cn(
                  'text-[9px] uppercase',
                  isToday ? 'font-bold' : 'text-muted-foreground'
                )} style={isToday ? { color: goal.color } : undefined}>
                  {format(d.date, 'EEEEE', { locale: sv })}
                </span>
              </div>
            );
          })}
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
