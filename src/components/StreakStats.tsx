import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, TrendingUp, Trophy } from 'lucide-react';
import { format, subDays, isSameDay, parseISO, startOfDay } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type Homework = Tables<'homework'>;
type StudyTask = Tables<'study_tasks'>;

interface HomeworkWithTasks extends Homework {
  tasks: StudyTask[];
}

interface StreakStatsProps {
  homework: HomeworkWithTasks[];
  childId: string;
}

interface StreakData {
  homeworkId: string;
  title: string;
  subject: string;
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
}

function calculateStreak(tasks: StudyTask[]): { currentStreak: number; longestStreak: number; totalCompleted: number } {
  if (tasks.length === 0) {
    return { currentStreak: 0, longestStreak: 0, totalCompleted: 0 };
  }

  // Sort tasks by date descending (most recent first)
  const sortedTasks = [...tasks].sort((a, b) => 
    new Date(b.task_date).getTime() - new Date(a.task_date).getTime()
  );

  const totalCompleted = tasks.filter(t => t.completed).length;

  // Build a map of dates to completion status
  const completionMap = new Map<string, boolean>();
  for (const task of sortedTasks) {
    completionMap.set(task.task_date, task.completed);
  }

  // Calculate current streak (consecutive days from today/most recent backwards)
  let currentStreak = 0;
  const today = startOfDay(new Date());
  
  // Find the most recent task date that has been completed
  let checkDate = today;
  
  // First, check if today has a task
  const todayStr = format(today, 'yyyy-MM-dd');
  if (completionMap.has(todayStr)) {
    // Start from today
    checkDate = today;
  } else {
    // Start from the most recent completed task
    const completedTasks = sortedTasks.filter(t => t.completed);
    if (completedTasks.length > 0) {
      checkDate = parseISO(completedTasks[0].task_date);
    } else {
      return { currentStreak: 0, longestStreak: 0, totalCompleted };
    }
  }

  // Count consecutive completed tasks going backwards
  for (let i = 0; i < 365; i++) {
    const dateStr = format(subDays(checkDate, i), 'yyyy-MM-dd');
    
    if (completionMap.has(dateStr)) {
      if (completionMap.get(dateStr)) {
        currentStreak++;
      } else {
        // There was a task but it wasn't completed - break the streak
        break;
      }
    }
    // If there was no task on this day, continue checking (skip non-task days)
  }

  // Calculate longest streak ever
  let longestStreak = 0;
  let tempStreak = 0;
  
  // Sort by date ascending for longest streak calculation
  const ascendingTasks = [...sortedTasks].reverse();
  
  for (const task of ascendingTasks) {
    if (task.completed) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  return { currentStreak, longestStreak, totalCompleted };
}

export function StreakStats({ homework, childId }: StreakStatsProps) {
  const streakData = useMemo(() => {
    // Only consider recurring homework for the active child
    const recurringHomework = homework.filter(
      hw => hw.child_id === childId && hw.is_recurring && hw.tasks.length > 0
    );

    const data: StreakData[] = recurringHomework.map(hw => {
      const { currentStreak, longestStreak, totalCompleted } = calculateStreak(hw.tasks);
      return {
        homeworkId: hw.id,
        title: hw.title,
        subject: hw.subject,
        currentStreak,
        longestStreak,
        totalCompleted,
      };
    });

    // Sort by current streak descending
    return data.sort((a, b) => b.currentStreak - a.currentStreak);
  }, [homework, childId]);

  if (streakData.length === 0) {
    return null;
  }

  // Get the best current streak for the main display
  const bestStreak = streakData[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Main streak card */}
      {bestStreak.currentStreak > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/20 via-amber-500/15 to-yellow-500/10 p-4 border border-orange-500/20">
          <div className="absolute top-2 right-2">
            <Flame className="w-8 h-8 text-orange-500/30" />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg">
              <Flame className="w-7 h-7 text-white" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-orange-500">
                  {bestStreak.currentStreak}
                </span>
                <span className="text-sm text-muted-foreground">
                  {bestStreak.currentStreak === 1 ? 'dag i rad' : 'dagar i rad'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {bestStreak.title}
              </p>
            </div>
          </div>
          
          {bestStreak.longestStreak > bestStreak.currentStreak && (
            <div className="mt-3 pt-3 border-t border-orange-500/10 flex items-center gap-2 text-xs text-muted-foreground">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Rekord: {bestStreak.longestStreak} dagar</span>
            </div>
          )}
        </div>
      )}

      {/* Other streaks (if there are more) */}
      {streakData.length > 1 && (
        <div className="space-y-2">
          {streakData.slice(1).map((streak) => (
            <div
              key={streak.homeworkId}
              className="flex items-center justify-between p-3 rounded-xl bg-card border border-border"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  streak.currentStreak > 0 
                    ? 'bg-orange-500/20 text-orange-500' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-sm">{streak.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {streak.totalCompleted} av {homework.find(h => h.id === streak.homeworkId)?.tasks.length || 0} klara
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className={`font-bold ${streak.currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                  {streak.currentStreak}
                </p>
                <p className="text-xs text-muted-foreground">i rad</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Show encouragement if no current streak */}
      {bestStreak.currentStreak === 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/50 border border-border">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-sm">Starta en ny streak!</p>
            <p className="text-xs text-muted-foreground">
              Klara din nästa {bestStreak.title.toLowerCase()} för att börja
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
