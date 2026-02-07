import { motion } from 'framer-motion';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { sv } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { SubjectBadge } from './ui/SubjectBadge';
import { Flag, FileCheck } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import { Subject, HOMEWORK_TYPE_LABELS, HomeworkType } from '@/types/homework';

type Homework = Tables<'homework'>;
type StudyTask = Tables<'study_tasks'>;

interface HomeworkWithTasks extends Homework {
  tasks: StudyTask[];
}

interface WeekViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  homework: HomeworkWithTasks[];
  activeChildId: string | null;
}

export function WeekView({ selectedDate, onSelectDate, homework, activeChildId }: WeekViewProps) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  const getTasksForDay = (date: Date): { task: StudyTask; homework: HomeworkWithTasks }[] => {
    if (!activeChildId) return [];
    const dateStr = format(date, 'yyyy-MM-dd');
    
    return homework
      .filter((hw) => hw.child_id === activeChildId)
      .flatMap((hw) =>
        hw.tasks
          .filter((t) => t.task_date === dateStr)
          .map((task) => ({ task, homework: hw }))
      );
  };
  
  // Get homework due on a specific day (not tasks, but actual due dates)
  // Returns both incomplete and completed homework for the day
  const getHomeworkDueOnDay = (date: Date): HomeworkWithTasks[] => {
    if (!activeChildId) return [];
    const dateStr = format(date, 'yyyy-MM-dd');
    
    return homework.filter(
      (hw) => hw.child_id === activeChildId && hw.due_date === dateStr
    );
  };
  
  // Get incomplete homework due on a specific day (for indicators)
  const getIncompleteHomeworkDueOnDay = (date: Date): HomeworkWithTasks[] => {
    return getHomeworkDueOnDay(date).filter((hw) => !hw.completed);
  };
  
  return (
    <div className="space-y-4">
      {/* Week header */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {weekDays.map((day, index) => {
          const tasks = getTasksForDay(day);
          const dueDates = getHomeworkDueOnDay(day);
          const incompleteDueDates = getIncompleteHomeworkDueOnDay(day);
          const completedCount = tasks.filter((t) => t.task.completed).length;
          const hasIncomplete = tasks.some((t) => !t.task.completed);
          const hasInlamning = incompleteDueDates.some((hw) => hw.homework_type === 'inlamning');
          const hasForhor = incompleteDueDates.some((hw) => hw.homework_type === 'forhor');
          const hasCompletedDeadline = dueDates.some((hw) => hw.completed);
          
          return (
            <motion.button
              key={day.toISOString()}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelectDate(day)}
              className={cn(
                'flex flex-col items-center min-w-[4rem] rounded-2xl px-3 py-2 transition-all',
                isSameDay(day, selectedDate)
                  ? 'bg-primary text-primary-foreground shadow-glow-primary'
                  : isToday(day)
                  ? 'bg-secondary'
                  : 'hover:bg-muted'
              )}
            >
              <span className="text-xs font-medium opacity-70">
                {format(day, 'EEE', { locale: sv })}
              </span>
              <span className="text-xl font-bold">
                {format(day, 'd')}
              </span>
              
              {/* Task and due date indicators */}
              <div className="flex gap-1 mt-1 items-center">
                {/* Due date indicators - diamond shape for distinction */}
                {hasInlamning && (
                  <span
                    className={cn(
                      'w-2 h-2 rotate-45',
                      isSameDay(day, selectedDate)
                        ? 'bg-primary-foreground'
                        : 'bg-warning'
                    )}
                    title="Inlämning"
                  />
                )}
                {hasForhor && (
                  <span
                    className={cn(
                      'w-2 h-2 rotate-45',
                      isSameDay(day, selectedDate)
                        ? 'bg-primary-foreground'
                        : 'bg-destructive'
                    )}
                    title="Förhör"
                  />
                )}
                {/* Task indicators - round */}
                {hasIncomplete && (
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full',
                      isSameDay(day, selectedDate)
                        ? 'bg-primary-foreground'
                        : 'bg-accent'
                    )}
                  />
                )}
                {(completedCount > 0 || hasCompletedDeadline) && (
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full',
                      isSameDay(day, selectedDate)
                        ? 'bg-primary-foreground/50'
                        : 'bg-success'
                    )}
                  />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
      
      {/* Due dates for selected day */}
      {getHomeworkDueOnDay(selectedDate).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Flag className="w-4 h-4" />
            Deadline
          </h3>
          {getHomeworkDueOnDay(selectedDate).map((hw, index) => (
            <motion.div
              key={hw.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border-2 border-dashed',
                hw.completed
                  ? 'bg-success/10 border-success/30'
                  : hw.homework_type === 'forhor'
                  ? 'bg-destructive/5 border-destructive/30'
                  : 'bg-warning/5 border-warning/30'
              )}
            >
              <SubjectBadge subject={hw.subject as Subject} size="sm" showLabel={false} />
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'font-medium truncate',
                  hw.completed && 'line-through text-muted-foreground'
                )}>{hw.title}</p>
                <p className="text-xs text-muted-foreground capitalize">{hw.subject}</p>
              </div>
              {hw.completed ? (
                <span className="text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 bg-success/10 text-success">
                  ✓ Klar
                </span>
              ) : (
                <span
                  className={cn(
                    'text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1',
                    hw.homework_type === 'forhor'
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-warning/10 text-warning-foreground'
                  )}
                >
                  {hw.homework_type === 'forhor' ? (
                    <FileCheck className="w-3 h-3" />
                  ) : (
                    <Flag className="w-3 h-3" />
                  )}
                  {HOMEWORK_TYPE_LABELS[hw.homework_type as HomeworkType]}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      )}
      
      {/* Tasks for selected day */}
      <div className="space-y-3">
        {getTasksForDay(selectedDate).length === 0 && getHomeworkDueOnDay(selectedDate).length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-muted-foreground"
          >
            <p className="text-lg">Inga uppgifter den här dagen! 🎉</p>
            <p className="text-sm">Njut av din lediga tid!</p>
          </motion.div>
        ) : getTasksForDay(selectedDate).length > 0 ? (
          <>
            <h3 className="text-sm font-medium text-muted-foreground">Uppgifter</h3>
            {getTasksForDay(selectedDate).map(({ task, homework: hw }, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl',
                  task.completed
                    ? 'bg-success/10'
                    : 'bg-card shadow-soft'
                )}
              >
                <SubjectBadge subject={hw.subject as Subject} size="sm" showLabel={false} />
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'font-medium truncate',
                      task.completed && 'line-through text-muted-foreground'
                    )}
                  >
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {hw.title}
                  </p>
                </div>
                {task.completed && (
                  <span className="text-success text-sm">✓</span>
                )}
              </motion.div>
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
}
