import { motion } from 'framer-motion';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { useHomeworkStore } from '@/stores/homeworkStore';
import { StudyTask, Homework } from '@/types/homework';
import { SubjectBadge } from './ui/SubjectBadge';

interface WeekViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export function WeekView({ selectedDate, onSelectDate }: WeekViewProps) {
  const { homework, activeChildId } = useHomeworkStore();
  
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  const getTasksForDay = (date: Date): { task: StudyTask; homework: Homework }[] => {
    if (!activeChildId) return [];
    const dateStr = format(date, 'yyyy-MM-dd');
    
    return homework
      .filter((hw) => hw.childId === activeChildId)
      .flatMap((hw) =>
        hw.tasks
          .filter((t) => t.date === dateStr)
          .map((task) => ({ task, homework: hw }))
      );
  };
  
  return (
    <div className="space-y-4">
      {/* Week header */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {weekDays.map((day, index) => {
          const tasks = getTasksForDay(day);
          const completedCount = tasks.filter((t) => t.task.completed).length;
          const hasIncomplete = tasks.some((t) => !t.task.completed);
          
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
                {format(day, 'EEE')}
              </span>
              <span className="text-xl font-bold">
                {format(day, 'd')}
              </span>
              
              {/* Task indicators */}
              {tasks.length > 0 && (
                <div className="flex gap-1 mt-1">
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
                  {completedCount > 0 && (
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
              )}
            </motion.button>
          );
        })}
      </div>
      
      {/* Tasks for selected day */}
      <div className="space-y-3">
        {getTasksForDay(selectedDate).length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-muted-foreground"
          >
            <p className="text-lg">No tasks for this day! 🎉</p>
            <p className="text-sm">Enjoy your free time!</p>
          </motion.div>
        ) : (
          getTasksForDay(selectedDate).map(({ task, homework: hw }, index) => (
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
              <SubjectBadge subject={hw.subject} size="sm" showLabel={false} />
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
          ))
        )}
      </div>
    </div>
  );
}
