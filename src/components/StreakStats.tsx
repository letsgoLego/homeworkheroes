import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Zap, Target, Star, TrendingUp, Trophy, Sparkles } from 'lucide-react';
import { format, subDays, startOfDay, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { sv } from 'date-fns/locale';
import type { Tables } from '@/integrations/supabase/types';

type Homework = Tables<'homework'>;
type StudyTask = Tables<'study_tasks'>;
type AdhocTask = Tables<'adhoc_tasks'>;

interface HomeworkWithTasks extends Homework {
  tasks: StudyTask[];
}

interface StreakStatsProps {
  homework: HomeworkWithTasks[];
  childId: string;
  adhocTasks?: AdhocTask[];
}

// Calculate XP level from total completions
function getLevel(totalCompleted: number): { level: number; xp: number; xpToNext: number; title: string } {
  const thresholds = [0, 5, 15, 30, 50, 80, 120, 170, 230, 300, 400];
  const titles = [
    '🌱 Nybörjare', '📚 Läsare', '✏️ Flitig', '🧠 Smart', '⚡ Snabb',
    '🔥 Eldsjäl', '💎 Diamant', '🚀 Raket', '👑 Mästare', '🏆 Legend', '🌟 Superstjärna'
  ];

  let level = 0;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (totalCompleted >= thresholds[i]) {
      level = i;
      break;
    }
  }

  const currentThreshold = thresholds[level] || 0;
  const nextThreshold = thresholds[level + 1] || currentThreshold + 100;
  const xp = totalCompleted - currentThreshold;
  const xpToNext = nextThreshold - currentThreshold;

  return { level, xp, xpToNext, title: titles[Math.min(level, titles.length - 1)] };
}

function getEncouragingMessage(completionRate: number, streak: number): string {
  if (streak >= 7) return 'En hel vecka i rad – du är ostoppbar! 🔥';
  if (streak >= 3) return 'Tre dagar i rad, snyggt jobbat! 💪';
  if (completionRate >= 100) return 'Perfekt vecka! Du krossar det! 🎉';
  if (completionRate >= 80) return 'Nästan allt klart, starkt! 💫';
  if (completionRate >= 50) return 'Halvvägs där, fortsätt så! 🚀';
  if (completionRate > 0) return 'Bra start, du har det här! ✨';
  return 'Ny vecka, nya möjligheter! 🌟';
}

export function StreakStats({ homework, childId, adhocTasks = [] }: StreakStatsProps) {
  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    // All tasks for this child
    const allStudyTasks = homework
      .filter(hw => hw.child_id === childId)
      .flatMap(hw => hw.tasks);

    const childAdhocTasks = adhocTasks.filter(t => t.child_id === childId);

    // --- Perfect day streak ---
    // A "perfect day" = all tasks scheduled for that day are completed
    let perfectStreak = 0;
    let longestPerfectStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < 90; i++) {
      const checkDate = format(subDays(today, i), 'yyyy-MM-dd');
      const dayStudyTasks = allStudyTasks.filter(t => t.task_date === checkDate);
      const dayAdhocTasks = childAdhocTasks.filter(t => t.task_date === checkDate);
      const allDayTasks = [...dayStudyTasks, ...dayAdhocTasks];

      if (allDayTasks.length === 0) continue; // skip days with no tasks

      const allDone = allDayTasks.every(t => t.completed);
      if (allDone) {
        tempStreak++;
        if (i <= perfectStreak + 3) perfectStreak = tempStreak; // allow gaps for no-task days for current
        longestPerfectStreak = Math.max(longestPerfectStreak, tempStreak);
      } else {
        if (i === 0 || perfectStreak === tempStreak) {
          // first miss breaks current streak
          perfectStreak = tempStreak;
        }
        tempStreak = 0;
      }
    }

    // Recalculate current streak more precisely
    let currentStreak = 0;
    for (let i = 0; i < 90; i++) {
      const checkDate = format(subDays(today, i), 'yyyy-MM-dd');
      const dayStudyTasks = allStudyTasks.filter(t => t.task_date === checkDate);
      const dayAdhocTasks = childAdhocTasks.filter(t => t.task_date === checkDate);
      const allDayTasks = [...dayStudyTasks, ...dayAdhocTasks];

      if (allDayTasks.length === 0) continue;

      const allDone = allDayTasks.every(t => t.completed);
      if (allDone) {
        currentStreak++;
      } else {
        break;
      }
    }

    // --- Weekly stats ---
    const weekStudyTasks = allStudyTasks.filter(t => {
      const d = parseISO(t.task_date);
      return isWithinInterval(d, { start: weekStart, end: weekEnd });
    });
    const weekAdhoc = childAdhocTasks.filter(t => {
      const d = parseISO(t.task_date);
      return isWithinInterval(d, { start: weekStart, end: weekEnd });
    });
    const weekTotal = weekStudyTasks.length + weekAdhoc.length;
    const weekCompleted = weekStudyTasks.filter(t => t.completed).length + weekAdhoc.filter(t => t.completed).length;
    const weekRate = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;

    // --- Total completed (all time) ---
    const totalCompleted = allStudyTasks.filter(t => t.completed).length + childAdhocTasks.filter(t => t.completed).length;

    // --- Best day of week ---
    const dayCompletions = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun
    for (const t of [...allStudyTasks.filter(t => t.completed), ...childAdhocTasks.filter(t => t.completed)]) {
      const d = parseISO(t.task_date || t.created_at);
      const dayIdx = (d.getDay() + 6) % 7; // Convert to Mon=0
      dayCompletions[dayIdx]++;
    }
    const bestDayIdx = dayCompletions.indexOf(Math.max(...dayCompletions));
    const dayNames = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];
    const bestDay = dayCompletions[bestDayIdx] > 0 ? dayNames[bestDayIdx] : null;

    // --- Homework completed this week ---
    const weekHomeworkCompleted = homework.filter(hw => {
      if (hw.child_id !== childId || !hw.completed || !hw.completed_at) return false;
      const d = parseISO(hw.completed_at);
      return isWithinInterval(d, { start: weekStart, end: weekEnd });
    }).length;

    return {
      currentStreak,
      longestPerfectStreak,
      weekCompleted,
      weekTotal,
      weekRate,
      totalCompleted,
      bestDay,
      weekHomeworkCompleted,
      level: getLevel(totalCompleted),
    };
  }, [homework, childId, adhocTasks]);

  const message = getEncouragingMessage(stats.weekRate, stats.currentStreak);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Encouraging message */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="text-center py-2"
      >
        <p className="text-lg font-semibold">{message}</p>
      </motion.div>

      {/* Level / XP card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 p-4 border border-primary/20"
      >
        <div className="absolute top-2 right-2">
          <Sparkles className="w-6 h-6 text-primary/20" />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg">
            <Star className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">{stats.level.title}</p>
            <p className="text-xs text-muted-foreground">Nivå {stats.level.level} • {stats.totalCompleted} uppgifter totalt</p>
            {/* XP bar */}
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (stats.level.xp / stats.level.xpToNext) * 100)}%` }}
                transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {stats.level.xp} / {stats.level.xpToNext} XP till nästa nivå
            </p>
          </div>
        </div>
      </motion.div>

      {/* Streak + Weekly grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Perfect day streak */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-gradient-to-br from-orange-500/15 to-amber-500/10 p-4 border border-orange-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="text-xs font-medium text-muted-foreground">Streak</span>
          </div>
          <p className="text-3xl font-bold text-orange-500">{stats.currentStreak}</p>
          <p className="text-xs text-muted-foreground">
            {stats.currentStreak === 1 ? 'perfekt dag' : 'perfekta dagar'} i rad
          </p>
          {stats.longestPerfectStreak > stats.currentStreak && (
            <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
              <Trophy className="w-3 h-3 text-amber-500" />
              Rekord: {stats.longestPerfectStreak}
            </div>
          )}
        </motion.div>

        {/* Weekly completion rate */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl bg-gradient-to-br from-success/15 to-emerald-500/10 p-4 border border-success/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-success" />
            <span className="text-xs font-medium text-muted-foreground">Denna vecka</span>
          </div>
          <p className="text-3xl font-bold text-success">{stats.weekRate}%</p>
          <p className="text-xs text-muted-foreground">
            {stats.weekCompleted} av {stats.weekTotal} klara
          </p>
        </motion.div>
      </div>

      {/* Fun stats row */}
      <div className="grid grid-cols-3 gap-2">
        {/* Assignments done this week */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl bg-card p-3 border border-border text-center"
        >
          <Zap className="w-4 h-4 mx-auto mb-1 text-primary" />
          <p className="text-xl font-bold">{stats.weekHomeworkCompleted}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">Läxor klara denna vecka</p>
        </motion.div>

        {/* Total completed */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl bg-card p-3 border border-border text-center"
        >
          <TrendingUp className="w-4 h-4 mx-auto mb-1 text-primary" />
          <p className="text-xl font-bold">{stats.totalCompleted}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">Uppgifter totalt</p>
        </motion.div>

        {/* Best day */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl bg-card p-3 border border-border text-center"
        >
          <Star className="w-4 h-4 mx-auto mb-1 text-celebration" />
          <p className="text-sm font-bold truncate">{stats.bestDay || '—'}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">Din bästa dag</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
