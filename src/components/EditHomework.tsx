import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFamily } from '@/hooks/useFamily';
import { format, parseISO, addDays, isBefore, isSameDay, startOfDay } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Plus, X, Calendar, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Homework = Tables<'homework'>;
type StudyTask = Tables<'study_tasks'>;

interface HomeworkWithTasks extends Homework {
  tasks: StudyTask[];
}

interface EditHomeworkProps {
  open: boolean;
  onClose: () => void;
  homework: HomeworkWithTasks;
}

export function EditHomework({ open, onClose, homework }: EditHomeworkProps) {
  const { addTask, deleteTask, refetch } = useFamily();
  const [loading, setLoading] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');

  const today = startOfDay(new Date());
  const minDate = format(today, 'yyyy-MM-dd');
  const maxTaskDate = format(addDays(parseISO(homework.due_date), -1), 'yyyy-MM-dd');

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !newTaskDate) return;

    const taskDate = parseISO(newTaskDate);
    const dueDateParsed = parseISO(homework.due_date);

    if (isSameDay(taskDate, dueDateParsed)) {
      toast.error("Kan inte schemalägga uppgifter på inlämningsdagen!");
      return;
    }

    if (isBefore(dueDateParsed, taskDate)) {
      toast.error("Uppgifter måste vara före inlämningsdagen!");
      return;
    }

    setLoading(true);
    await addTask(homework.id, newTaskTitle.trim(), newTaskDate);
    setNewTaskTitle('');
    setNewTaskDate('');
    await refetch();
    setLoading(false);
  };

  const handleDeleteTask = async (taskId: string) => {
    setLoading(true);
    await deleteTask(taskId);
    await refetch();
    setLoading(false);
  };

  const sortedTasks = [...homework.tasks].sort(
    (a, b) => new Date(a.task_date).getTime() - new Date(b.task_date).getTime()
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto border-0 shadow-elevated">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Redigera uppgifter
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{homework.title}</p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add task form */}
          <div className="p-3 rounded-xl bg-muted/50 space-y-3">
            <Input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Vad ska du göra?"
              disabled={loading}
            />
            <div className="flex gap-2">
              <Input
                type="date"
                value={newTaskDate}
                onChange={(e) => setNewTaskDate(e.target.value)}
                min={minDate}
                max={maxTaskDate}
                className="flex-1"
                disabled={loading}
              />
              <Button
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim() || !newTaskDate || loading}
                size="icon"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              📝 Inlämning: {format(parseISO(homework.due_date), 'd MMM', { locale: sv })}
            </p>
          </div>

          {/* Task list */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Uppgifter ({sortedTasks.length})
            </h3>
            
            <AnimatePresence mode="popLayout">
              {sortedTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Inga uppgifter ännu. Lägg till en ovan!
                </p>
              ) : (
                sortedTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className={`flex items-center justify-between p-3 rounded-xl shadow-soft ${
                      task.completed ? 'bg-success/10' : 'bg-card'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(parseISO(task.task_date), 'EEE d MMM', { locale: sv })}
                        {task.completed && ' ✓'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      disabled={loading}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          <Button onClick={onClose} className="w-full" variant="outline">
            Klar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
