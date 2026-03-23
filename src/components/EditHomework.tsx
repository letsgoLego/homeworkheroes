import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useFamily } from '@/hooks/useFamily';
import { format, parseISO, addDays, isBefore, isSameDay, startOfDay, eachDayOfInterval, isWeekend, subDays } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Plus, X, Calendar, Trash2, Bell, Repeat, Check, Flag } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Subject, SUBJECT_LABELS, SUBJECT_ICONS, HomeworkType, HOMEWORK_TYPE_LABELS, HOMEWORK_TYPE_ICONS } from '@/types/homework';
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

export function EditHomework({ open, onClose, homework: editingHomework }: EditHomeworkProps) {
  const { addTask, deleteTask, updateHomework, refetch, homework: allHomework } = useFamily();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'tasks'>('details');
  
  // Details state
  const [title, setTitle] = useState(editingHomework.title);
  const [subject, setSubject] = useState<Subject>(editingHomework.subject as Subject);
  const [description, setDescription] = useState(editingHomework.description || '');
  const [dueDate, setDueDate] = useState(editingHomework.due_date);
  const [bringItems, setBringItems] = useState<string[]>(editingHomework.bring_to_school || []);
  const [newItem, setNewItem] = useState('');
  const [enableReminder, setEnableReminder] = useState(!!editingHomework.reminder_date);
  const [submissionDay, setSubmissionDay] = useState<number>(editingHomework.submission_day ?? 5);
  const [homeworkType, setHomeworkType] = useState<HomeworkType>((editingHomework.homework_type as HomeworkType) || 'inlamning');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>(editingHomework.recurrence_days || [1, 2, 3, 4, 5]);
  
  // Task state
  const [taskTitle, setTaskTitle] = useState('Plugga');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const today = startOfDay(new Date());
  const minDate = format(today, 'yyyy-MM-dd');

  // Generate available days between today and day before due date
  const availableDays = useMemo(() => {
    if (editingHomework.is_recurring) return [];
    const dueDateParsed = parseISO(editingHomework.due_date);
    const endDate = subDays(dueDateParsed, 1);
    if (endDate < today) return [];
    return eachDayOfInterval({ start: today, end: endDate });
  }, [editingHomework.due_date, editingHomework.is_recurring, today]);

  // Get existing task dates to show which are already scheduled
  const existingTaskDates = useMemo(() => {
    return editingHomework.tasks.map(t => t.task_date);
  }, [editingHomework.tasks]);

  // Calculate task counts per day for this child (for workload indicator)
  const taskCountsByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    
    allHomework
      .filter(hw => hw.child_id === editingHomework.child_id)
      .forEach(hw => {
        hw.tasks.forEach(task => {
          // Don't count tasks from the homework we're editing, or completed tasks
          if (hw.id !== editingHomework.id && !task.completed) {
            counts[task.task_date] = (counts[task.task_date] || 0) + 1;
          }
        });
      });
    
    return counts;
  }, [allHomework, editingHomework.child_id, editingHomework.id]);

  // Reset state when homework changes
  useEffect(() => {
    setTitle(editingHomework.title);
    setSubject(editingHomework.subject as Subject);
    setDescription(editingHomework.description || '');
    setDueDate(editingHomework.due_date);
    setBringItems(editingHomework.bring_to_school || []);
    setEnableReminder(!!editingHomework.reminder_date);
    setSubmissionDay(editingHomework.submission_day ?? 5);
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

  const selectAllDays = () => {
    const allDates = availableDays
      .filter(d => !existingTaskDates.includes(format(d, 'yyyy-MM-dd')))
      .map(d => format(d, 'yyyy-MM-dd'));
    setSelectedDays(allDates);
  };

  const selectWeekdaysOnly = () => {
    const weekdayDates = availableDays
      .filter(day => !isWeekend(day) && !existingTaskDates.includes(format(day, 'yyyy-MM-dd')))
      .map(d => format(d, 'yyyy-MM-dd'));
    setSelectedDays(weekdayDates);
  };

  const selectEveryOtherDay = () => {
    const availableNonExisting = availableDays.filter(d => !existingTaskDates.includes(format(d, 'yyyy-MM-dd')));
    const everyOther = availableNonExisting
      .filter((_, i) => i % 2 === 0)
      .map(d => format(d, 'yyyy-MM-dd'));
    setSelectedDays(everyOther);
  };

  const handleAddSelectedDays = async () => {
    if (selectedDays.length === 0) return;

    setLoading(true);
    for (const dateStr of selectedDays.sort()) {
      await addTask(editingHomework.id, taskTitle || 'Plugga', dateStr);
    }
    setSelectedDays([]);
    await refetch();
    setLoading(false);
    toast.success(`${selectedDays.length} uppgift${selectedDays.length > 1 ? 'er' : ''} tillagda`);
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto border-0 shadow-elevated">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            Redigera läxa
            {editingHomework.is_recurring && (
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
            Uppgifter ({editingHomework.tasks.length})
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

              {/* Homework type */}
              <div>
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Flag className="w-4 h-4" />
                  Typ av läxa
                </Label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  {(['inlamning', 'forhor'] as HomeworkType[]).map((type) => (
                    <button
                      key={type}
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
                    </button>
                  ))}
                </div>
              </div>

              {/* Due date - only for non-recurring */}
              {!editingHomework.is_recurring && (
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

              {/* Recurring days - only for recurring */}
              {editingHomework.is_recurring && (
                <>
                  <div>
                    <Label className="text-sm font-medium">Vilka dagar i veckan?</Label>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {WEEKDAYS.map((day) => (
                        <button
                          key={day.value}
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
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submission day */}
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
                </>
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
              <p className="text-sm text-muted-foreground">
                Välj dagar att lägga till eller ta bort befintliga uppgifter. 
                Inlämning: {format(parseISO(editingHomework.due_date), 'd MMMM', { locale: sv })}
              </p>

              {/* Task title */}
              <div>
                <Label className="text-sm font-medium">Vad ska göras?</Label>
                <Input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="t.ex. Plugga, Läs, Öva"
                  className="mt-1.5"
                  disabled={loading}
                />
              </div>

              {/* Quick select buttons */}
              {availableDays.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={selectAllDays}
                    className="flex-1"
                    disabled={loading}
                  >
                    Alla
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={selectWeekdaysOnly}
                    className="flex-1"
                    disabled={loading}
                  >
                    Vardagar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={selectEveryOtherDay}
                    className="flex-1"
                    disabled={loading}
                  >
                    Varannan
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedDays([])}
                    className="flex-1"
                    disabled={loading}
                  >
                    Rensa
                  </Button>
                </div>
              )}

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
                    
                    return (
                      <button
                        key={dateStr}
                        onClick={() => !hasExistingTask && toggleDay(dateStr)}
                        disabled={hasExistingTask || loading}
                        className={cn(
                          'relative p-3 rounded-xl text-center transition-all',
                          hasExistingTask
                            ? 'bg-success/20 cursor-not-allowed opacity-70'
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
                        {/* Workload indicator for other homework */}
                        {otherTaskCount > 0 && !isSelected && !hasExistingTask && (
                          <div className={cn(
                            "absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                            otherTaskCount >= 3 
                              ? "bg-destructive/20 text-destructive"
                              : otherTaskCount >= 2 
                                ? "bg-warning/20 text-warning-foreground"
                                : "bg-muted-foreground/20 text-muted-foreground"
                          )}>
                            {otherTaskCount} uppg
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
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Inga dagar kvar att lägga till före inlämningsdagen
                </p>
              )}

              {selectedDays.length > 0 && (
                <div className="space-y-2">
                  <div className="text-center text-sm text-muted-foreground">
                    {selectedDays.length} ny{selectedDays.length > 1 ? 'a' : ''} dag{selectedDays.length > 1 ? 'ar' : ''} vald{selectedDays.length > 1 ? 'a' : ''}
                  </div>
                  <Button
                    onClick={handleAddSelectedDays}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? 'Lägger till...' : `Lägg till ${selectedDays.length} uppgift${selectedDays.length > 1 ? 'er' : ''}`}
                  </Button>
                </div>
              )}

              {/* Existing tasks */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Befintliga uppgifter ({sortedTasks.length})
                </h3>
                
                <AnimatePresence mode="popLayout">
                  {sortedTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Inga uppgifter ännu. Välj dagar ovan!
                    </p>
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
