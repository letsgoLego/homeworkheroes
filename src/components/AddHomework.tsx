import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Subject, SUBJECT_LABELS, SUBJECT_ICONS, HomeworkType, HOMEWORK_TYPE_LABELS, HOMEWORK_TYPE_ICONS } from '@/types/homework';
import { useFamily } from '@/hooks/useFamily';
import { cn } from '@/lib/utils';
import { format, addDays, addWeeks, parseISO, startOfDay, eachDayOfInterval, isWeekend, isSameDay, subDays, getDay } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Plus, X, ArrowRight, Check, User, Bell, Repeat, Flag, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { UpgradeModal } from '@/components/UpgradeModal';

interface AddHomeworkProps {
  open: boolean;
  onClose: () => void;
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

export function AddHomework({ open, onClose }: AddHomeworkProps) {
  const { addHomework, addTask, addRecurringPackItem, activeChildId, children, setActiveChildId, homework, getActiveHomeworkCount } = useFamily();
  const { subscribed } = useSubscriptionContext();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  
  // Use selected child or fallback to active child
  const targetChildId = selectedChildId || activeChildId;
  const targetChild = children.find(c => c.id === targetChildId);
  
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<Subject>('other');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [bringItems, setBringItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [taskTitle, setTaskTitle] = useState('Plugga');
  const [enableReminder, setEnableReminder] = useState(true);
  
  // Homework type (inlämning or förhör)
  const [homeworkType, setHomeworkType] = useState<HomeworkType>('inlamning');
  
  // Recurring homework state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri by default
  const [recurrenceWeeks, setRecurrenceWeeks] = useState(4); // Default 4 weeks
  const [submissionDay, setSubmissionDay] = useState<number>(5); // Friday by default
  
  // Recurring pack items for recurring homework
  const [recurringBringDays, setRecurringBringDays] = useState<number[]>([]);
  
  const today = startOfDay(new Date());
  const minDate = format(today, 'yyyy-MM-dd');
  
  // Generate available days between today and day before due date (inclusive)
  const availableDays = useMemo(() => {
    if (!dueDate || isRecurring) return [];
    const dueDateParsed = parseISO(dueDate);
    // Include all days from today up to and including the day before due date
    const endDate = subDays(dueDateParsed, 1);
    if (endDate < today) return [];
    return eachDayOfInterval({ start: today, end: endDate });
  }, [dueDate, today, isRecurring]);
  
  // Calculate task counts per day for the target child (for workload indicator)
  const taskCountsByDate = useMemo(() => {
    if (!targetChildId) return {};
    const counts: Record<string, number> = {};
    
    homework
      .filter(hw => hw.child_id === targetChildId)
      .forEach(hw => {
        hw.tasks.forEach(task => {
          if (!task.completed) {
            counts[task.task_date] = (counts[task.task_date] || 0) + 1;
          }
        });
      });
    
    return counts;
  }, [homework, targetChildId]);

  const resetForm = () => {
    setStep(1);
    setTitle('');
    setSubject('other');
    setDescription('');
    setDueDate('');
    setBringItems([]);
    setNewItem('');
    setSelectedDays([]);
    setTaskTitle('Plugga');
    setSelectedChildId(null);
    setEnableReminder(true);
    setIsRecurring(false);
    setRecurrenceDays([1, 2, 3, 4, 5]);
    setRecurrenceWeeks(4);
    setSubmissionDay(5);
    setHomeworkType('inlamning');
    setRecurringBringDays([]);
  };
  
  const handleClose = () => {
    resetForm();
    onClose();
  };
  
  const addBringItem = () => {
    if (newItem.trim()) {
      setBringItems([...bringItems, newItem.trim()]);
      setNewItem('');
    }
  };
  
  const removeBringItem = (index: number) => {
    setBringItems(bringItems.filter((_, i) => i !== index));
  };
  
  const toggleDay = (dateStr: string) => {
    setSelectedDays(prev => 
      prev.includes(dateStr) 
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr]
    );
  };
  
  const selectAllDays = () => {
    const allDates = availableDays.map(d => format(d, 'yyyy-MM-dd'));
    setSelectedDays(allDates);
  };
  
  const selectWeekdaysOnly = () => {
    const weekdayDates = availableDays
      .filter(day => !isWeekend(day))
      .map(d => format(d, 'yyyy-MM-dd'));
    setSelectedDays(weekdayDates);
  };
  
  const selectEveryOtherDay = () => {
    const everyOther = availableDays
      .filter((_, i) => i % 2 === 0)
      .map(d => format(d, 'yyyy-MM-dd'));
    setSelectedDays(everyOther);
  };
  
  const toggleRecurrenceDay = (day: number) => {
    setRecurrenceDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort((a, b) => a - b)
    );
  };
  
  // Generate task dates for recurring homework
  const generateRecurringTaskDates = () => {
    const dates: string[] = [];
    const endDate = addWeeks(today, recurrenceWeeks);
    const allDays = eachDayOfInterval({ start: today, end: endDate });
    
    for (const day of allDays) {
      const dayOfWeek = getDay(day);
      if (recurrenceDays.includes(dayOfWeek)) {
        dates.push(format(day, 'yyyy-MM-dd'));
      }
    }
    
    return dates;
  };
  
  const FREE_LIMIT = 3;
  const activeCount = targetChildId ? getActiveHomeworkCount(targetChildId) : 0;
  const isAtLimit = !subscribed && activeCount >= FREE_LIMIT;

  const handleSubmit = async () => {
    if (!targetChildId) {
      toast.error("Välj ett barn först");
      return;
    }

    if (isAtLimit) {
      setShowUpgrade(true);
      return;
    }
    
    if (!title.trim()) {
      toast.error("Fyll i titel");
      return;
    }
    
    // For recurring, we need recurrence days selected
    if (isRecurring && recurrenceDays.length === 0) {
      toast.error("Välj minst en dag för återkommande läxa");
      return;
    }
    
    // For non-recurring, we need due date
    if (!isRecurring && !dueDate) {
      toast.error("Välj ett inlämningsdatum");
      return;
    }
    
    setLoading(true);
    
    // Calculate dates
    const recurrenceEndDate = isRecurring ? format(addWeeks(today, recurrenceWeeks), 'yyyy-MM-dd') : undefined;
    const effectiveDueDate = isRecurring ? recurrenceEndDate! : dueDate;
    const dueDateParsed = parseISO(effectiveDueDate);
    const reminderDate = enableReminder && !isRecurring ? format(subDays(dueDateParsed, 2), 'yyyy-MM-dd') : undefined;
    
    const homework = await addHomework({
      title: title.trim(),
      subject,
      description: description.trim() || undefined,
      dueDate: effectiveDueDate,
      childId: targetChildId,
      bringToSchool: bringItems.length > 0 ? bringItems : undefined,
      reminderDate,
      isRecurring,
      recurrenceDays: isRecurring ? recurrenceDays : undefined,
      recurrenceEndDate,
      submissionDay: isRecurring ? submissionDay : undefined,
      homeworkType,
    });
    
    // Add recurring pack items for bring days (for recurring homework)
    if (isRecurring && recurringBringDays.length > 0 && bringItems.length > 0) {
      for (const item of bringItems) {
        await addRecurringPackItem(targetChildId, item, recurringBringDays);
      }
    }
    
    if (homework) {
      // Generate and add tasks
      const taskDates = isRecurring ? generateRecurringTaskDates() : selectedDays.sort();
      
      for (const dateStr of taskDates) {
        await addTask(homework.id, taskTitle || 'Plugga', dateStr);
      }
      
      // Update active child to match the one we just added homework for
      if (targetChildId !== activeChildId) {
        setActiveChildId(targetChildId);
      }
    }
    
    setLoading(false);
    handleClose();
  };
  
  const canProceedStep1 = title.trim() && (isRecurring ? recurrenceDays.length > 0 : dueDate);
  
  return (
    <>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto border-0 shadow-elevated">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {step === 1 ? 'Ny läxa' : 'När ska du plugga?'}
          </DialogTitle>
        </DialogHeader>

        {/* Free tier limit warning */}
        {isAtLimit && (
          <div className="p-3 rounded-xl bg-celebration/10 border border-celebration/20">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="w-4 h-4 text-celebration" />
              <p className="text-sm font-bold text-celebration-foreground">Max {FREE_LIMIT} aktiva läxor</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Uppgradera till Premium för obegränsat antal läxor.
            </p>
            <Button size="sm" className="mt-2 w-full" onClick={() => setShowUpgrade(true)}>
              Uppgradera nu
            </Button>
          </div>
        )}
        
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Child selector */}
              {children.length > 1 && (
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Läxa för
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => setSelectedChildId(child.id)}
                        className={cn(
                          'px-4 py-2 rounded-full text-sm font-medium transition-all',
                          (selectedChildId || activeChildId) === child.id
                            ? 'text-primary-foreground shadow-md'
                            : 'bg-muted hover:bg-muted/80'
                        )}
                        style={{
                          backgroundColor: (selectedChildId || activeChildId) === child.id ? child.color : undefined,
                        }}
                      >
                        {child.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Show single child info */}
              {children.length === 1 && targetChild && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: targetChild.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    Läxa för <span className="font-medium text-foreground">{targetChild.name}</span>
                  </span>
                </div>
              )}
              
              {/* Title */}
              <div className="p-4 -mx-4 bg-primary/5 border-l-4 border-primary rounded-r-xl">
                <Label htmlFor="title" className="text-base font-bold text-primary flex items-center gap-2">
                  <span className="text-lg">📝</span>
                  Vad är läxan?
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="t.ex. Matte kapitel 5"
                  className="mt-2 h-12 text-base border-2 border-primary/30 focus:border-primary bg-background"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Skriv en kort titel för läxan
                </p>
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
              
              {/* Homework type selector */}
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
              
              {/* Recurring toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Återkommande läxa</p>
                    <p className="text-xs text-muted-foreground">
                      T.ex. läsläxa varje vecka
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isRecurring}
                  onCheckedChange={(checked) => {
                    setIsRecurring(checked);
                    if (checked) {
                      setDueDate('');
                      setSelectedDays([]);
                    }
                  }}
                />
              </div>
              
              {isRecurring ? (
                <>
                  {/* Recurring days selection */}
                  <div>
                    <Label className="text-sm font-medium">Vilka dagar i veckan?</Label>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {WEEKDAYS.map((day) => (
                        <button
                          key={day.value}
                          onClick={() => toggleRecurrenceDay(day.value)}
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
                    <Label className="text-sm font-medium">Vilken dag lämnas den in?</Label>
                    <p className="text-xs text-muted-foreground mb-1.5">
                      T.ex. logg som lämnas in varje fredag
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
                  
                  {/* Duration */}
                  <div>
                    <Label className="text-sm font-medium">Hur länge?</Label>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {[2, 4, 8, 12].map((weeks) => (
                        <button
                          key={weeks}
                          onClick={() => setRecurrenceWeeks(weeks)}
                          className={cn(
                            'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                            recurrenceWeeks === weeks
                              ? 'bg-primary text-primary-foreground shadow-glow-primary'
                              : 'bg-muted hover:bg-muted/80'
                          )}
                        >
                          {weeks} veckor
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {recurrenceDays.length > 0 && (
                        <>
                          Det blir {recurrenceDays.length * recurrenceWeeks} uppgifter totalt
                          (t.o.m. {format(addWeeks(today, recurrenceWeeks), 'd MMM yyyy', { locale: sv })})
                        </>
                      )}
                    </p>
                  </div>
                </>
              ) : (
                /* Due Date for non-recurring */
                <div>
                  <Label htmlFor="dueDate" className="text-sm font-medium">
                    När ska den lämnas in?
                  </Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => {
                      setDueDate(e.target.value);
                      setSelectedDays([]); // Reset selected days when due date changes
                    }}
                    min={minDate}
                    className="mt-1.5"
                  />
                </div>
              )}
              
              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  Anteckningar (valfritt)
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Extra detaljer..."
                  className="mt-1.5 resize-none"
                  rows={2}
                />
              </div>
              
              {/* Bring to school */}
              <div>
                <Label className="text-sm font-medium">
                  Vad ska tas med till skolan?
                </Label>
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
              
              {/* Reminder toggle - only for non-recurring */}
              {!isRecurring && (
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
              
              {isRecurring ? (
                /* For recurring, add task title here and go directly to submit */
                <>
                  <div>
                    <Label className="text-sm font-medium">Vad ska göras varje dag?</Label>
                    <Input
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="t.ex. Läs, Öva, Plugga"
                      className="mt-1.5"
                    />
                  </div>
                  
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || !canProceedStep1}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? 'Sparar...' : 'Skapa återkommande läxa'}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                  className="w-full"
                  size="lg"
                >
                  Nästa: Välj pluggdagar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                Välj vilka dagar du vill plugga på läxan. Inlämning: {dueDate ? format(parseISO(dueDate), 'd MMMM', { locale: sv }) : ''}
              </p>
              
              {/* Task title */}
              <div>
                <Label className="text-sm font-medium">Vad ska du göra?</Label>
                <Input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="t.ex. Plugga, Läs, Öva"
                  className="mt-1.5"
                />
              </div>
              
              {/* Quick select buttons */}
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={selectAllDays}
                  className="flex-1"
                >
                  Alla dagar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={selectWeekdaysOnly}
                  className="flex-1"
                >
                  Vardagar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={selectEveryOtherDay}
                  className="flex-1"
                >
                  Varannan
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedDays([])}
                  className="flex-1"
                >
                  Rensa
                </Button>
              </div>
              
              {/* Day picker */}
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                {availableDays.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isSelected = selectedDays.includes(dateStr);
                  const isToday = isSameDay(day, today);
                  const isWeekendDay = isWeekend(day);
                  const existingTaskCount = taskCountsByDate[dateStr] || 0;
                  
                  return (
                    <button
                      key={dateStr}
                      onClick={() => toggleDay(dateStr)}
                      className={cn(
                        'relative p-3 rounded-xl text-center transition-all',
                        isSelected 
                          ? 'bg-primary text-primary-foreground shadow-glow-primary' 
                          : isWeekendDay
                            ? 'bg-accent/50 hover:bg-accent/70'
                            : 'bg-muted hover:bg-muted/80',
                        isToday && !isSelected && 'ring-2 ring-primary/50'
                      )}
                    >
                      <div className={cn(
                        "text-xs font-medium capitalize",
                        isWeekendDay && !isSelected && "text-accent-foreground/80"
                      )}>
                        {format(day, 'EEE', { locale: sv })}
                      </div>
                      <div className="text-lg font-bold">
                        {format(day, 'd')}
                      </div>
                      <div className="text-xs opacity-70">
                        {format(day, 'MMM', { locale: sv })}
                      </div>
                      {/* Workload indicator */}
                      {existingTaskCount > 0 && !isSelected && (
                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                          {Array.from({ length: Math.min(existingTaskCount, 5) }).map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                existingTaskCount >= 3 
                                  ? "bg-destructive"
                                  : existingTaskCount >= 2 
                                    ? "bg-warning"
                                    : "bg-muted-foreground"
                              )}
                            />
                          ))}
                        </div>
                      )}
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-1 right-1 w-4 h-4 bg-primary-foreground/20 rounded-full flex items-center justify-center"
                        >
                          <Check className="w-3 h-3" />
                        </motion.div>
                      )}
                    </button>
                  );
                })}
              </div>

              {availableDays.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Inga dagar före inlämningsdagen
                </p>
              )}
              
              <div className="text-center text-sm text-muted-foreground">
                {selectedDays.length > 0 
                  ? `${selectedDays.length} pluggdag${selectedDays.length > 1 ? 'ar' : ''} vald${selectedDays.length > 1 ? 'a' : ''}`
                  : 'Inga dagar valda (valfritt)'}
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1"
                >
                  Tillbaka
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Sparar...' : 'Spara läxa'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
    <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </>
  );
}
