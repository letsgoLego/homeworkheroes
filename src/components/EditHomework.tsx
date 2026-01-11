import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useFamily } from '@/hooks/useFamily';
import { format, parseISO, addDays, isBefore, isSameDay, startOfDay } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Plus, X, Calendar, Trash2, Bell, Repeat } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Subject, SUBJECT_LABELS, SUBJECT_ICONS } from '@/types/homework';
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

const subjects: Subject[] = ['math', 'science', 'language', 'history', 'art', 'music', 'sports', 'other'];

const WEEKDAYS = [
  { value: 1, label: 'Mån' },
  { value: 2, label: 'Tis' },
  { value: 3, label: 'Ons' },
  { value: 4, label: 'Tor' },
  { value: 5, label: 'Fre' },
  { value: 6, label: 'Lör' },
  { value: 0, label: 'Sön' },
];

export function EditHomework({ open, onClose, homework }: EditHomeworkProps) {
  const { addTask, deleteTask, updateHomework, refetch } = useFamily();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'tasks'>('details');
  
  // Details state
  const [title, setTitle] = useState(homework.title);
  const [subject, setSubject] = useState<Subject>(homework.subject as Subject);
  const [description, setDescription] = useState(homework.description || '');
  const [dueDate, setDueDate] = useState(homework.due_date);
  const [bringItems, setBringItems] = useState<string[]>(homework.bring_to_school || []);
  const [newItem, setNewItem] = useState('');
  const [enableReminder, setEnableReminder] = useState(!!homework.reminder_date);
  const [submissionDay, setSubmissionDay] = useState<number>(homework.submission_day ?? 5);
  
  // Task state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');

  const today = startOfDay(new Date());
  const minDate = format(today, 'yyyy-MM-dd');

  // Reset state when homework changes
  useEffect(() => {
    setTitle(homework.title);
    setSubject(homework.subject as Subject);
    setDescription(homework.description || '');
    setDueDate(homework.due_date);
    setBringItems(homework.bring_to_school || []);
    setEnableReminder(!!homework.reminder_date);
    setSubmissionDay(homework.submission_day ?? 5);
  }, [homework]);

  const addBringItem = () => {
    if (newItem.trim()) {
      setBringItems([...bringItems, newItem.trim()]);
      setNewItem('');
    }
  };

  const removeBringItem = (index: number) => {
    setBringItems(bringItems.filter((_, i) => i !== index));
  };

  const handleSaveDetails = async () => {
    if (!title.trim()) {
      toast.error('Fyll i titel');
      return;
    }

    setLoading(true);
    
    const dueDateParsed = parseISO(dueDate);
    const reminderDate = enableReminder && !homework.is_recurring 
      ? format(addDays(dueDateParsed, -2), 'yyyy-MM-dd') 
      : null;

    const success = await updateHomework(homework.id, {
      title: title.trim(),
      subject,
      description: description.trim() || undefined,
      dueDate,
      bringToSchool: bringItems.length > 0 ? bringItems : undefined,
      reminderDate,
      submissionDay: homework.is_recurring ? submissionDay : null,
    });

    if (success) {
      await refetch();
    }
    
    setLoading(false);
  };

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

  const maxTaskDate = format(addDays(parseISO(homework.due_date), -1), 'yyyy-MM-dd');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto border-0 shadow-elevated">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            Redigera läxa
            {homework.is_recurring && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                <Repeat className="w-3 h-3" />
                Återkommande
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('details')}
            className={cn(
              'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all',
              activeTab === 'details'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            Detaljer
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={cn(
              'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all',
              activeTab === 'tasks'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            Uppgifter ({homework.tasks.length})
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'details' ? (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              {/* Title */}
              <div>
                <Label htmlFor="edit-title" className="text-sm font-medium">
                  Titel
                </Label>
                <Input
                  id="edit-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              {/* Subject */}
              <div>
                <Label className="text-sm font-medium">Ämne</Label>
                <div className="grid grid-cols-4 gap-2 mt-1.5">
                  {subjects.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSubject(s)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-2 rounded-xl transition-all',
                        subject === s
                          ? 'bg-primary text-primary-foreground shadow-glow-primary'
                          : 'bg-muted hover:bg-muted/80'
                      )}
                    >
                      <span className="text-xl">{SUBJECT_ICONS[s]}</span>
                      <span className="text-xs font-medium">{SUBJECT_LABELS[s]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Due date - only for non-recurring */}
              {!homework.is_recurring && (
                <div>
                  <Label htmlFor="edit-dueDate" className="text-sm font-medium">
                    Inlämningsdatum
                  </Label>
                  <Input
                    id="edit-dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={minDate}
                    className="mt-1.5"
                  />
                </div>
              )}

              {/* Submission day - only for recurring */}
              {homework.is_recurring && (
                <div>
                  <Label className="text-sm font-medium">Inlämningsdag</Label>
                  <p className="text-xs text-muted-foreground mb-1.5">
                    Vilken veckodag lämnas den in?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((day) => (
                      <button
                        key={day.value}
                        onClick={() => setSubmissionDay(day.value)}
                        className={cn(
                          'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                          submissionDay === day.value
                            ? 'bg-accent text-accent-foreground shadow-md'
                            : 'bg-muted hover:bg-muted/80'
                        )}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <Label htmlFor="edit-description" className="text-sm font-medium">
                  Anteckningar
                </Label>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1.5 resize-none"
                  rows={2}
                />
              </div>

              {/* Bring to school */}
              <div>
                <Label className="text-sm font-medium">Ta med till skolan</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="t.ex. Arbetsbok"
                    onKeyDown={(e) => e.key === 'Enter' && addBringItem()}
                  />
                  <Button onClick={addBringItem} size="icon" variant="secondary">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {bringItems.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {bringItems.map((item, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent text-sm"
                      >
                        {item}
                        <button onClick={() => removeBringItem(i)}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Reminder - only for non-recurring */}
              {!homework.is_recurring && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Påminnelse</p>
                      <p className="text-xs text-muted-foreground">
                        Påminn 2 dagar före inlämning
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={enableReminder}
                    onCheckedChange={setEnableReminder}
                  />
                </div>
              )}

              <Button
                onClick={handleSaveDetails}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Sparar...' : 'Spara ändringar'}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
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
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
