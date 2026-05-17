import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useFamily } from '@/hooks/useFamily';
import { format, parseISO, addDays, isSameDay, startOfDay, eachDayOfInterval, isWeekend, subDays } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Plus, X, Calendar, Trash2, Bell, Repeat, Check, Flag, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Subject, SUBJECT_LABELS, SUBJECT_ICONS, HomeworkType, HOMEWORK_TYPE_LABELS, HOMEWORK_TYPE_ICONS } from '@/types/homework';
import { celebrateTask } from '@/lib/confetti';
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

const subjects: Subject[] = ['math', 'science', 'language', 'history', 'art', 'music', 'english', 'other'];

const WEEKDAYS = [
  { value: 1, label: 'Mån' },
  { value: 2, label: 'Tis' },
  { value: 3, label: 'Ons' },
  { value: 4, label: 'Tor' },
  { value: 5, label: 'Fre' },
  { value: 6, label: 'Lör' },
  { value: 0, label: 'Sön' },
];

function getLoadEmoji(count: number): string {
  if (count === 0) return '';
  if (count <= 1) return '📚';
  if (count <= 2) return '📝';
  return '🔥';
}

function generateAutoTitle(homeworkType: HomeworkType, subject: Subject, title: string): string {
  const subjectLabel = SUBJECT_LABELS[subject];
  if (homeworkType === 'forhor') return `Plugga inför förhör – ${subjectLabel}`;
  if (title.trim()) return `Jobba med ${title.trim()}`;
  return `Plugga ${subjectLabel}`;
}

export function EditHomework({ open, onClose, homework: editingHomework }: EditHomeworkProps) {
  const { addTask, deleteTask, updateHomework, refetch, homework: allHomework } = useFamily();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'tasks'>('details');
  const [subjectAnimKey, setSubjectAnimKey] = useState(0);
  
  // Details state
  const [title, setTitle] = useState(editingHomework.title);
  const [subject, setSubject] = useState<Subject>(editingHomework.subject as Subject);
  const [description, setDescription] = useState(editingHomework.description || '');
  const [dueDate, setDueDate] = useState(editingHomework.due_date);
  const [bringItems, setBringItems] = useState<string[]>(editingHomework.bring_to_school || []);
  const [newItem, setNewItem] = useState('');
  const [enableReminder, setEnableReminder] = useState(!!editingHomework.reminder_date);
  const [submissionDay, setSubmissionDay] = useState<number | null>(editingHomework.submission_day ?? 5);
  const [homeworkType, setHomeworkType] = useState<HomeworkType>((editingHomework.homework_type as HomeworkType) || 'inlamning');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>(editingHomework.recurrence_days || [1, 2, 3, 4, 5]);
  
  // Task state
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const today = startOfDay(new Date());
  const minDate = format(today, 'yyyy-MM-dd');

  const availableDays = useMemo(() => {
    if (editingHomework.is_recurring) return [];
    const dueDateParsed = parseISO(editingHomework.due_date);
    const endDate = subDays(dueDateParsed, 1);
    if (endDate < today) return [];
    return eachDayOfInterval({ start: today, end: endDate });
  }, [editingHomework.due_date, editingHomework.is_recurring, today]);

  const existingTaskDates = useMemo(() => {
    return editingHomework.tasks.map(t => t.task_date);
  }, [editingHomework.tasks]);

  const taskCountsByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    allHomework
      .filter(hw => hw.child_id === editingHomework.child_id)
      .forEach(hw => {
        hw.tasks.forEach(task => {
          if (hw.id !== editingHomework.id && !task.completed) {
            counts[task.task_date] = (counts[task.task_date] || 0) + 1;
          }
        });
      });
    return counts;
  }, [allHomework, editingHomework.child_id, editingHomework.id]);

  useEffect(() => {
    setTitle(editingHomework.title);
    setSubject(editingHomework.subject as Subject);
    setDescription(editingHomework.description || '');
    setDueDate(editingHomework.due_date);
    setBringItems(editingHomework.bring_to_school || []);
    setEnableReminder(!!editingHomework.reminder_date);
    setSubmissionDay(editingHomework.submission_day);
    setHomeworkType((editingHomework.homework_type as HomeworkType) || 'inlamning');
    setRecurrenceDays(editingHomework.recurrence_days || [1, 2, 3, 4, 5]);
  }, [editingHomework]);

  const addBringItem = () => {
    if (newItem.trim()) {
      setBringItems([...bringItems, newItem.trim()]);
      setNewItem('');
    }
  };

  const removeBringItem = (index: number) => {
    setBringItems(bringItems.filter((_, i) => i !== index));
  };

  const handleSelectSubject = (s: Subject) => {
    setSubject(s);
    setSubjectAnimKey(prev => prev + 1);
  };

  const handleSaveDetails = async () => {
    if (!title.trim()) {
      toast.error('Fyll i titel');
      return;
    }

    setLoading(true);
    
    const dueDateParsed = parseISO(dueDate);
    const reminderDate = enableReminder && !editingHomework.is_recurring 
      ? format(addDays(dueDateParsed, -2), 'yyyy-MM-dd') 
      : null;

    const success = await updateHomework(editingHomework.id, {
      title: title.trim(),
      subject,
      description: description.trim() || undefined,
      dueDate,
      bringToSchool: bringItems.length > 0 ? bringItems : undefined,
      reminderDate,
      submissionDay: editingHomework.is_recurring ? submissionDay : null,
      homeworkType,
      recurrenceDays: editingHomework.is_recurring ? recurrenceDays : undefined,
    });

    if (success) {
      await refetch();
      toast.success('Ändringar sparade ✨');
      celebrateTask();
    }
    
    setLoading(false);
  };

  const toggleDay = (dateStr: string) => {
    setSelectedDays(prev => 
      prev.includes(dateStr) 
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr]
    );
  };

  const handleAddSelectedDays = async () => {
    if (selectedDays.length === 0) return;

    setLoading(true);
    const autoTitle = generateAutoTitle(homeworkType, subject, title);
    for (const dateStr of selectedDays.sort()) {
      await addTask(editingHomework.id, autoTitle, dateStr);
    }
    setSelectedDays([]);
    await refetch();
    setLoading(false);
    toast.success(
      <div className="flex flex-col">
        <span className="font-bold">Klart! 🎉</span>
        <span className="text-sm">{selectedDays.length} pluggdag{selectedDays.length > 1 ? 'ar' : ''} tillagda</span>
      </div>
    );
    celebrateTask();
  };

  const handleDeleteTask = async (taskId: string) => {
    setLoading(true);
    await deleteTask(taskId);
    await refetch();
    setLoading(false);
  };

  const sortedTasks = [...editingHomework.tasks].sort(
    (a, b) => new Date(a.task_date).getTime() - new Date(b.task_date).getTime()
  );

  const completedCount = sortedTasks.filter(t => t.completed).length;
  const progressPercent = sortedTasks.length > 0 ? (completedCount / sortedTasks.length) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto border-0 shadow-elevated">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              ✏️ Redigera läxa
              {editingHomework.is_recurring && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Repeat className="w-3 h-3" />
                  Återkommande
                </span>
              )}
            </DialogTitle>
          </div>
          {/* Progress bar */}
          {sortedTasks.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>{completedCount}/{sortedTasks.length} klara</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="h-full bg-success rounded-full"
                />
              </div>
            </div>
          )}
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 mb-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveTab('details')}
            className={cn(
              'flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all',
              activeTab === 'details'
                ? 'bg-primary text-primary-foreground shadow-glow-primary'
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            📋 Detaljer
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveTab('tasks')}
            className={cn(
              'flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all',
              activeTab === 'tasks'
                ? 'bg-primary text-primary-foreground shadow-glow-primary'
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            📅 Uppgifter ({editingHomework.tasks.length})
          </motion.button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'details' ? (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Title */}
              <div className="p-4 -mx-4 bg-primary/5 border-l-4 border-primary rounded-r-xl">
                <Label htmlFor="edit-title" className="text-base font-bold text-primary flex items-center gap-2">
                  <span className="text-lg">🤔</span>
                  Vad handlar läxan om?
                </Label>
                <Input
                  id="edit-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-2 h-12 text-base border-2 border-primary/30 focus:border-primary bg-background"
                />
              </div>

              {/* Subject with animation */}
              <div>
                <Label className="text-sm font-medium">Ämne</Label>
                <div className="grid grid-cols-4 gap-2 mt-1.5">
                  {subjects.map((s) => (
                    <motion.button
                      key={s}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleSelectSubject(s)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-2 rounded-xl transition-all',
                        subject === s
                          ? 'bg-primary text-primary-foreground shadow-glow-primary'
                          : 'bg-muted hover:bg-muted/80'
                      )}
                    >
                      <motion.span
                        key={`${s}-${subjectAnimKey}`}
                        initial={subject === s ? { scale: 1.5, rotate: 15 } : {}}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        className="text-xl"
                      >
                        {SUBJECT_ICONS[s]}
                      </motion.span>
                      <span className="text-xs font-medium">{SUBJECT_LABELS[s]}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Homework type */}
              <div>
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Flag className="w-4 h-4" />
                  Typ av läxa
                </Label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  {(['inlamning', 'forhor'] as HomeworkType[]).map((type) => (
                    <motion.button
                      key={type}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setHomeworkType(type)}
                      className={cn(
                        'flex items-center justify-center gap-2 p-3 rounded-xl transition-all',
                        homeworkType === type
                          ? 'bg-primary text-primary-foreground shadow-glow-primary'
                          : 'bg-muted hover:bg-muted/80'
                      )}
                    >
                      <span className="text-lg">{HOMEWORK_TYPE_ICONS[type]}</span>
                      <span className="text-sm font-medium">{HOMEWORK_TYPE_LABELS[type]}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Due date - only for non-recurring */}
              {!editingHomework.is_recurring && (
                <div>
                  <Label htmlFor="edit-dueDate" className="text-sm font-medium">
                    {homeworkType === 'forhor' ? 'När är förhöret? 📅' : 'När ska den lämnas in? 📅'}
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

              {/* Recurring days */}
              {editingHomework.is_recurring && (
                <>
                  <div>
                    <Label className="text-sm font-medium">Vilka dagar i veckan?</Label>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {WEEKDAYS.map((day) => (
                        <motion.button
                          key={day.value}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setRecurrenceDays(prev =>
                            prev.includes(day.value)
                              ? prev.filter(d => d !== day.value)
                              : [...prev, day.value].sort((a, b) => a - b)
                          )}
                          className={cn(
                            'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                            recurrenceDays.includes(day.value)
                              ? 'bg-primary text-primary-foreground shadow-glow-primary'
                              : 'bg-muted hover:bg-muted/80'
                          )}
                        >
                          {day.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Inlämningsdag</Label>
                    <p className="text-xs text-muted-foreground mb-1.5">
                      Vilken veckodag lämnas den in? Välj "Ingen inlämning" för t.ex. läsläxa.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSubmissionDay(null)}
                        className={cn(
                          'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                          submissionDay === null
                            ? 'bg-accent text-accent-foreground shadow-md'
                            : 'bg-muted hover:bg-muted/80'
                        )}
                      >
                        Ingen inlämning
                      </motion.button>
                      {WEEKDAYS.map((day) => (
                        <motion.button
                          key={day.value}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setSubmissionDay(day.value)}
                          className={cn(
                            'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                            submissionDay === day.value
                              ? 'bg-accent text-accent-foreground shadow-md'
                              : 'bg-muted hover:bg-muted/80'
                          )}
                        >
                          {day.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Description */}
              <div>
                <Label htmlFor="edit-description" className="text-sm font-medium">
                  Vill du skriva något mer? 💭
                </Label>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Extra detaljer..."
                  className="mt-1.5 resize-none"
                  rows={2}
                />
              </div>

              {/* Bring to school */}
              <div>
                <Label className="text-sm font-medium">Vad ska tas med till skolan? 🎒</Label>
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
                      <motion.span
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent text-sm"
                      >
                        {item}
                        <button onClick={() => removeBringItem(i)}>
                          <X className="w-3 h-3" />
                        </button>
                      </motion.span>
                    ))}
                  </div>
                )}
              </div>

              {/* Reminder */}
              {!editingHomework.is_recurring && (
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
                size="lg"
              >
                {loading ? 'Sparar...' : 'Spara ändringar ✨'}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Smart info header */}
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Lägg till eller ta bort pluggdagar
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {homeworkType === 'forhor' ? 'Förhör' : 'Inlämning'}: {format(parseISO(editingHomework.due_date), 'd MMMM', { locale: sv })}
                </p>
              </div>

              {/* Day picker */}
              {availableDays.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                  {availableDays.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isSelected = selectedDays.includes(dateStr);
                    const hasExistingTask = existingTaskDates.includes(dateStr);
                    const isToday = isSameDay(day, today);
                    const isWeekendDay = isWeekend(day);
                    const otherTaskCount = taskCountsByDate[dateStr] || 0;
                    const loadEmoji = getLoadEmoji(otherTaskCount);
                    
                    return (
                      <motion.button
                        key={dateStr}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => !hasExistingTask && toggleDay(dateStr)}
                        disabled={hasExistingTask || loading}
                        className={cn(
                          'relative p-3 rounded-xl text-center transition-all',
                          hasExistingTask
                            ? 'bg-success/20 cursor-not-allowed'
                            : isSelected 
                              ? 'bg-primary text-primary-foreground shadow-glow-primary' 
                              : isWeekendDay
                                ? 'bg-accent/50 hover:bg-accent/70'
                                : 'bg-muted hover:bg-muted/80',
                          isToday && !isSelected && !hasExistingTask && 'ring-2 ring-primary/50'
                        )}
                      >
                        <div className={cn(
                          "text-xs font-medium capitalize",
                          isWeekendDay && !isSelected && !hasExistingTask && "text-accent-foreground/80"
                        )}>
                          {format(day, 'EEE', { locale: sv })}
                        </div>
                        <div className="text-lg font-bold">
                          {format(day, 'd')}
                        </div>
                        <div className="text-xs opacity-70">
                          {format(day, 'MMM', { locale: sv })}
                        </div>
                        {/* Workload emoji */}
                        {otherTaskCount > 0 && !isSelected && !hasExistingTask && (
                          <div className="text-[10px] mt-0.5 opacity-70">
                            {loadEmoji}
                          </div>
                        )}
                        {(isSelected || hasExistingTask) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={cn(
                              "absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center",
                              hasExistingTask ? "bg-success/40" : "bg-primary-foreground/20"
                            )}
                          >
                            <Check className="w-3 h-3" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Inga dagar kvar att lägga till 📭
                </p>
              )}

              {/* Legend */}
              {availableDays.length > 0 && (
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground justify-center">
                  <span>😎 Lugnt</span>
                  <span>📚 Lite</span>
                  <span>🔥 Fullt</span>
                  <span className="text-success">✓ Redan planerad</span>
                </div>
              )}

              {selectedDays.length > 0 && (
                <div className="space-y-2">
                  <div className="text-center text-sm font-medium text-primary">
                    {selectedDays.length} ny{selectedDays.length > 1 ? 'a' : ''} pluggdag{selectedDays.length > 1 ? 'ar' : ''} ✨
                  </div>
                  <Button
                    onClick={handleAddSelectedDays}
                    disabled={loading}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? 'Lägger till...' : `Lägg till ${selectedDays.length} pluggdag${selectedDays.length > 1 ? 'ar' : ''} 🎉`}
                  </Button>
                </div>
              )}

              {/* Existing tasks */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  📋 Befintliga uppgifter ({sortedTasks.length})
                </h3>
                
                <AnimatePresence mode="popLayout">
                  {sortedTasks.length === 0 ? (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-muted-foreground text-center py-4"
                    >
                      Inga uppgifter ännu. Välj dagar ovan! ☝️
                    </motion.p>
                  ) : (
                    sortedTasks.map((task) => (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl shadow-soft",
                          task.completed ? 'bg-success/10' : 'bg-card'
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "font-medium",
                            task.completed && 'line-through text-muted-foreground'
                          )}>
                            {task.title}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(parseISO(task.task_date), 'EEE d MMM', { locale: sv })}
                            {task.completed && ' ✓'}
                          </p>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteTask(task.id)}
                          disabled={loading}
                          className="p-2 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              <Button onClick={onClose} className="w-full" variant="outline" size="lg">
                Klar 👍
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
