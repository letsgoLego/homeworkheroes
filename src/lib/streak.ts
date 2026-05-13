import { format, subDays, startOfDay } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type Homework = Tables<'homework'>;
type StudyTask = Tables<'study_tasks'>;
type AdhocTask = Tables<'adhoc_tasks'>;

interface HomeworkWithTasks extends Homework {
  tasks: StudyTask[];
}

/**
 * Calculates current "perfect day" streak for a child:
 * consecutive days (going back from today) where every task scheduled
 * for that day is completed. Days with no tasks are skipped (don't break).
 */
export function computeCurrentStreak(
  homework: HomeworkWithTasks[],
  adhocTasks: AdhocTask[],
  childId: string
): number {
  const today = startOfDay(new Date());
  const allStudyTasks = homework.filter(hw => hw.child_id === childId).flatMap(hw => hw.tasks);
  const childAdhocTasks = adhocTasks.filter(t => t.child_id === childId);

  let streak = 0;
  for (let i = 0; i < 90; i++) {
    const dateStr = format(subDays(today, i), 'yyyy-MM-dd');
    const dayStudy = allStudyTasks.filter(t => t.task_date === dateStr);
    const dayAdhoc = childAdhocTasks.filter(t => t.task_date === dateStr);
    const all = [...dayStudy, ...dayAdhoc];
    if (all.length === 0) continue;
    if (all.every(t => t.completed)) streak++;
    else break;
  }
  return streak;
}
