import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, startOfWeek, endOfWeek, parseISO, differenceInCalendarDays } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Flame, Target, Trophy, Flag, FileCheck, Sparkles } from 'lucide-react';
import { computeCurrentStreak } from '@/lib/streak';
import { SUBJECT_ICONS, type Subject } from '@/types/homework';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

type StudyTask = Tables<'study_tasks'>;
type Homework = Tables<'homework'>;
type AdhocTask = Tables<'adhoc_tasks'>;
interface HomeworkWithTasks extends Homework { tasks: StudyTask[] }

interface Props {
  childId: string;
  childName: string;
  homework: HomeworkWithTasks[];
  adhocTasks: AdhocTask[];
}

export function ChildWeekDashboard({ childId, childName, homework, adhocTasks }: Props) {
  const data = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const wkStart = startOfWeek(today, { weekStartsOn: 1 });
    const wkEnd = endOfWeek(today, { weekStartsOn: 1 });
    const startStr = format(wkStart, 'yyyy-MM-dd');
    const endStr = format(wkEnd, 'yyyy-MM-dd');

    const childHw = homework.filter((h) => h.child_id === childId);
    const childAdhoc = adhocTasks.filter((a) => a.child_id === childId);

    // Tasks scheduled this week (study tasks + adhoc)
    const weekStudy = childHw
      .flatMap((h) => h.tasks)
      .filter((t) => t.task_date >= startStr && t.task_date <= endStr);
    const weekAdhoc = childAdhoc.filter((t) => t.task_date >= startStr && t.task_date <= endStr);
    const allWeek = [...weekStudy, ...weekAdhoc];
    const total = allWeek.length;
    const done = allWeek.filter((t) => t.completed).length;
    const pct = total ? Math.round((done / total) * 100) : 0;

    // Big events this week (inlämning / förhör)
    const events = childHw
      .filter((h) => !h.completed && h.due_date >= todayStr && h.due_date <= endStr)
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .slice(0, 3)
      .map((h) => ({
        h,
        daysLeft: differenceInCalendarDays(parseISO(h.due_date), today),
      }));

    const streak = computeCurrentStreak(homework, adhocTasks, childId);

    // Today's progress for motivational copy
    const todayAll = [
      ...childHw.flatMap((h) => h.tasks).filter((t) => t.task_date === todayStr && (!t.snoozed_until || t.snoozed_until <= todayStr)),
      ...childAdhoc.filter((t) => t.task_date === todayStr),
    ];
    const todayDone = todayAll.filter((t) => t.completed).length;
    const todayTotal = todayAll.length;

    return { total, done, pct, events, streak, todayDone, todayTotal };
  }, [childId, homework, adhocTasks]);

  const message = useMemo(() => {
    if (data.total === 0) return { emoji: '🌟', text: 'Ingen plan den här veckan – passa på att vila eller hjälp till hemma!' };
    if (data.pct === 100) return { emoji: '🏆', text: `Otroligt, ${childName}! Hela veckan är klar – du är en hjälte!` };
    if (data.pct >= 75) return { emoji: '🚀', text: `Bara ${data.total - data.done} uppgifter kvar – du nästan är i mål!` };
    if (data.pct >= 50) return { emoji: '💪', text: `Halvvägs! Fortsätt så, ${childName}!` };
    if (data.pct >= 25) return { emoji: '🔥', text: 'Bra start på veckan – kör några till idag!' };
    return { emoji: '✨', text: `Ny vecka, ${childName}! Bocka av första uppgiften och kom igång.` };
  }, [data, childName]);

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-gradient-to-br from-primary/15 via-accent/10 to-celebration/10 border border-primary/20 p-4 space-y-4 shadow-card"
    >
      {/* Headline */}
      <div className="flex items-start gap-3">
        <div className="text-3xl">{message.emoji}</div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Din vecka</p>
          <p className="text-sm font-medium leading-snug mt-0.5">{message.text}</p>
        </div>
      </div>

      {/* Progress bar */}
      {data.total > 0 && (
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Target className="w-3 h-3" /> Veckans plan
            </span>
            <span className="text-xs font-bold tabular-nums">
              {data.done}/{data.total} <span className="text-muted-foreground font-normal">({data.pct}%)</span>
            </span>
          </div>
          <div className="h-2.5 bg-background/60 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.pct}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className={cn(
                'h-full rounded-full',
                data.pct === 100 ? 'bg-success' : 'bg-gradient-to-r from-primary to-accent',
              )}
            />
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-background/60 p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 text-celebration">
            <Flame className="w-3.5 h-3.5" />
            <span className="text-lg font-bold tabular-nums">{data.streak}</span>
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Streak</p>
        </div>
        <div className="rounded-xl bg-background/60 p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-lg font-bold tabular-nums">{data.todayDone}/{data.todayTotal}</span>
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Idag</p>
        </div>
        <div className="rounded-xl bg-background/60 p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 text-accent-foreground">
            <Trophy className="w-3.5 h-3.5" />
            <span className="text-lg font-bold tabular-nums">{data.events.length}</span>
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Event</p>
        </div>
      </div>

      {/* Upcoming events */}
      {data.events.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            På gång den här veckan
          </p>
          {data.events.map(({ h, daysLeft }) => {
            const isForhor = h.homework_type === 'forhor';
            return (
              <div
                key={h.id}
                className="flex items-center gap-2 p-2 rounded-xl bg-background/60"
              >
                <span className="text-lg">{SUBJECT_ICONS[h.subject as Subject] || '📝'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{h.title}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    {isForhor ? <FileCheck className="w-2.5 h-2.5" /> : <Flag className="w-2.5 h-2.5" />}
                    {isForhor ? 'Förhör' : 'Inlämning'} ·{' '}
                    {daysLeft === 0 ? 'Idag!' : daysLeft === 1 ? 'Imorgon' : `Om ${daysLeft} dgr`}
                    {' · '}{format(parseISO(h.due_date), 'EEE d MMM', { locale: sv })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.section>
  );
}
