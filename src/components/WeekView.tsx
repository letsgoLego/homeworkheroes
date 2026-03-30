import { useState } from 'react';
import { motion } from 'framer-motion';
import { format, startOfWeek, addDays, isSameDay, isToday, isPast, isBefore } from 'date-fns';
import { sv } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { SubjectBadge } from './ui/SubjectBadge';
import { Flag, FileCheck, Filter } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import { Subject, HOMEWORK_TYPE_LABELS, HomeworkType } from '@/types/homework';
import { Button } from './ui/button';
import type { Activity } from '@/hooks/queries/useHomeworkData';

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
  getActivitiesForDate?: (childId: string, date: Date) => Activity[];
}

type FilterType = 'all' | 'inlamning' | 'forhor';

export function WeekView({ selectedDate, onSelectDate, homework, activeChildId }: WeekViewProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getItemsForDay = (date: Date) => {
    if (!activeChildId) return { deadlines: [] as HomeworkWithTasks[], tasks: [] as { task: StudyTask; homework: HomeworkWithTasks }[] };
    const dateStr = format(date, 'yyyy-MM-dd');

    let deadlines = homework.filter(
      (hw) => hw.child_id === activeChildId && hw.due_date === dateStr
    );

    let tasks = homework
      .filter((hw) => hw.child_id === activeChildId)
      .flatMap((hw) =>
        hw.tasks
          .filter((t) => t.task_date === dateStr)
          .map((task) => ({ task, homework: hw }))
      );

    // Apply filter — when filtering by type, only show deadlines of that type (not study tasks)
    if (filter !== 'all') {
      deadlines = deadlines.filter((hw) => hw.homework_type === filter);
      tasks = []; // Hide study tasks when filtering by deadline type
    }

    return { deadlines, tasks };
  };

  const hasAnyContent = weekDays.some((day) => {
    const { deadlines, tasks } = getItemsForDay(day);
    return deadlines.length > 0 || tasks.length > 0;
  });

  return (
    <div className="space-y-2">
      {/* Filter buttons */}
      <div className="flex gap-2 items-center pb-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
          className="h-7 text-xs"
        >
          Alla
        </Button>
        <Button
          variant={filter === 'inlamning' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('inlamning')}
          className="h-7 text-xs"
        >
          <Flag className="w-3 h-3 mr-1" />
          Inlämningar
        </Button>
        <Button
          variant={filter === 'forhor' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('forhor')}
          className="h-7 text-xs"
        >
          <FileCheck className="w-3 h-3 mr-1" />
          Förhör
        </Button>
      </div>

      {/* Scrollable day list */}
      {!hasAnyContent ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-muted-foreground"
        >
          <p className="text-lg">Inga uppgifter den här veckan! 🎉</p>
          <p className="text-sm">Njut av din lediga tid!</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {weekDays.map((day, dayIndex) => {
            const { deadlines, tasks } = getItemsForDay(day);
            if (deadlines.length === 0 && tasks.length === 0) return null;

            return (
              <motion.div
                key={day.toISOString()}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: dayIndex * 0.04 }}
              >
                {/* Day header */}
                <div
                  className={cn(
                    'flex items-center gap-3 mb-2 sticky top-0 z-10 py-1',
                    isToday(day) ? 'text-primary' : 'text-foreground'
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold shrink-0',
                      isToday(day)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {format(day, 'd')}
                  </div>
                  <span className="text-sm font-medium capitalize">
                    {format(day, 'EEEE', { locale: sv })}
                  </span>
                  {isToday(day) && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      Idag
                    </span>
                  )}
                </div>

                {/* Items for the day */}
                <div className="space-y-2 ml-[3.25rem]">
                  {/* Deadlines */}
                  {deadlines.map((hw, index) => (
                    <motion.div
                      key={hw.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: dayIndex * 0.04 + index * 0.05 }}
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

                  {/* Study tasks */}
                  {tasks.map(({ task, homework: hw }, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: dayIndex * 0.04 + (deadlines.length + index) * 0.05 }}
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
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
