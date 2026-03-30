import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Subject, SUBJECT_LABELS, SUBJECT_ICONS, HomeworkType, HOMEWORK_TYPE_LABELS, HOMEWORK_TYPE_ICONS } from '@/types/homework';
import { useFamily } from '@/hooks/useFamily';
import { cn } from '@/lib/utils';
import { format, addDays, addWeeks, parseISO, startOfDay, eachDayOfInterval, isWeekend, isSameDay, subDays, getDay } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Plus, X, ArrowRight, Check, User, Bell, Repeat, Flag, Lock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { UpgradeModal } from '@/components/UpgradeModal';
import { celebrateTask } from '@/lib/confetti';

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

interface QuickTemplate {
  label: string;
  emoji: string;
  type: HomeworkType;
  suggestedSubject?: Subject;
  isRecurring?: boolean;
}

const QUICK_TEMPLATES: QuickTemplate[] = [
  { label: 'Läsläxa', emoji: '📖', type: 'inlamning', suggestedSubject: 'language', isRecurring: true },
  { label: 'Prov / Förhör', emoji: '✍️', type: 'forhor' },
  { label: 'Inlämning', emoji: '📄', type: 'inlamning' },
];

function getLoadLabel(count: number): { text: string; emoji: string } {
  if (count === 0) return { text: 'Lugnt', emoji: '😎' };
  if (count === 1) return { text: 'Lite att göra', emoji: '📚' };
  if (count === 2) return { text: 'En del', emoji: '📝' };
  return { text: 'Fullt schema!', emoji: '🔥' };
}

function generateAutoTitle(homeworkType: HomeworkType, subject: Subject, title: string): string {
  const subjectLabel = SUBJECT_LABELS[subject];
  if (homeworkType === 'forhor') {
    return `Plugga inför förhör – ${subjectLabel}`;
  }
  if (title.trim()) {
    return `Jobba med ${title.trim()}`;
  }
  return `Plugga ${subjectLabel}`;
}

function suggestStudyDays(
  availableDays: Date[],
  taskCountsByDate: Record<string, number>,
  activityCountsByDate: Record<string, number>,
  suggestedCount: number
): string[] {
  // Sort days by workload (ascending), prefer weekdays, penalize days with activities
  const scored = availableDays.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const load = taskCountsByDate[dateStr] || 0;
    const activityLoad = activityCountsByDate[dateStr] || 0;
    const weekendPenalty = isWeekend(day) ? 2 : 0;
    return { dateStr, score: load + activityLoad * 2 + weekendPenalty };
  });
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, suggestedCount).map(s => s.dateStr);
}

export function AddHomework({ open, onClose }: AddHomeworkProps) {
  const { addHomework, addTask, addRecurringPackItem, activeChildId, children, setActiveChildId, homework, getActiveHomeworkCount, getActivitiesForDate } = useFamily();
  const { subscribed } = useSubscriptionContext();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  
  const targetChildId = selectedChildId || activeChildId;
  const targetChild = children.find(c => c.id === targetChildId);
  
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<Subject>('other');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [bringItems, setBringItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [enableReminder, setEnableReminder] = useState(true);
  const [homeworkType, setHomeworkType] = useState<HomeworkType>('inlamning');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [recurrenceWeeks, setRecurrenceWeeks] = useState(4);
  const [submissionDay, setSubmissionDay] = useState<number>(5);
  const [recurringBringDays, setRecurringBringDays] = useState<number[]>([]);
  const [suggestedDayCount, setSuggestedDayCount] = useState(3);
  const [subjectAnimKey, setSubjectAnimKey] = useState(0);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  
  const today = startOfDay(new Date());
  const minDate = format(today, 'yyyy-MM-dd');
  
  const availableDays = useMemo(() => {
    if (!dueDate || isRecurring) return [];
    const dueDateParsed = parseISO(dueDate);
    const endDate = subDays(dueDateParsed, 1);
    if (endDate < today) return [];
    return eachDayOfInterval({ start: today, end: endDate });
  }, [dueDate, today, isRecurring]);
  
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

  // Auto-suggest days when available days or suggested count changes
  useEffect(() => {
    if (availableDays.length > 0 && step === 2 && selectedDays.length === 0) {
      const count = Math.min(suggestedDayCount, availableDays.length);
      const suggested = suggestStudyDays(availableDays, taskCountsByDate, count);
      setSelectedDays(suggested);
    }
  }, [step]); // Only run when entering step 2

  const resetForm = () => {
    setStep(1);
    setTitle('');
    setSubject('other');
    setDescription('');
    setDueDate('');
    setBringItems([]);
    setNewItem('');
    setSelectedDays([]);
    setSelectedChildId(null);
    setEnableReminder(true);
    setIsRecurring(false);
    setRecurrenceDays([1, 2, 3, 4, 5]);
    setRecurrenceWeeks(4);
    setSubmissionDay(5);
    setHomeworkType('inlamning');
    setRecurringBringDays([]);
    setSuggestedDayCount(3);
    setActiveTemplate(null);
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
  
  const toggleRecurrenceDay = (day: number) => {
    setRecurrenceDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort((a, b) => a - b)
    );
  };
  
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

  const applyTemplate = (template: QuickTemplate) => {
    setActiveTemplate(template.label);
    setHomeworkType(template.type);
    setIsRecurring(!!template.isRecurring);
    if (template.isRecurring) {
      setDueDate('');
      setSelectedDays([]);
    }
    if (template.suggestedSubject) {
      setSubject(template.suggestedSubject);
      setSubjectAnimKey(prev => prev + 1);
    }
    celebrateTask();
  };

  const handleSelectSubject = (s: Subject) => {
    setSubject(s);
    setSubjectAnimKey(prev => prev + 1);
  };

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
    
    if (isRecurring && recurrenceDays.length === 0) {
      toast.error("Välj minst en dag för återkommande läxa");
      return;
    }
    
    if (!isRecurring && !dueDate) {
      toast.error("Välj ett datum");
      return;
    }
    
    setLoading(true);
    
    const recurrenceEndDate = isRecurring ? format(addWeeks(today, recurrenceWeeks), 'yyyy-MM-dd') : undefined;
    const effectiveDueDate = isRecurring ? recurrenceEndDate! : dueDate;
    const dueDateParsed = parseISO(effectiveDueDate);
    const reminderDate = enableReminder && !isRecurring ? format(subDays(dueDateParsed, 2), 'yyyy-MM-dd') : undefined;
    
    const hw = await addHomework({
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
    
    if (isRecurring && recurringBringDays.length > 0 && bringItems.length > 0) {
      for (const item of bringItems) {
        await addRecurringPackItem(targetChildId, item, recurringBringDays);
      }
    }
    
    if (hw) {
      const taskDates = isRecurring ? generateRecurringTaskDates() : selectedDays.sort();
      const autoTitle = generateAutoTitle(homeworkType, subject, title);
      
      for (const dateStr of taskDates) {
        await addTask(hw.id, autoTitle, dateStr);
      }
      
      if (targetChildId !== activeChildId) {
        setActiveChildId(targetChildId);
      }
      
      toast.success(
        <div className="flex flex-col">
          <span className="font-bold">Bra jobbat! 💪</span>
          <span className="text-sm">Du har planerat {taskDates.length} pluggdag{taskDates.length !== 1 ? 'ar' : ''}</span>
        </div>
      );
      celebrateTask();
    }
    
    setLoading(false);
    handleClose();
  };
  
  const canProceedStep1 = title.trim() && (isRecurring ? recurrenceDays.length > 0 : dueDate);
  
  // Progress indicator
  const totalSteps = isRecurring ? 1 : 2;
  const progressEmoji = step === 1 ? '🚀' : '🎯';
  
  return (
    <>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto border-0 shadow-elevated">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {progressEmoji} {step === 1 ? 'Ny läxa' : 'Planera pluggdagar'}
            </DialogTitle>
            {!isRecurring && (
              <div className="flex items-center gap-1">
                {[1, 2].map(s => (
                  <div 
                    key={s}
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      s <= step ? "bg-primary w-8" : "bg-muted w-4"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogHeader>

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

              {/* Quick templates */}
              <div>
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Snabbval
                </Label>
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  {QUICK_TEMPLATES.map((tpl) => (
                    <motion.button
                      key={tpl.label}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => applyTemplate(tpl)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-3 rounded-xl transition-all border-2',
                        activeTemplate === tpl.label
                          ? 'border-primary bg-primary/10 shadow-md'
                          : 'border-transparent bg-muted hover:bg-muted/80'
                      )}
                    >
                      <span className="text-2xl">{tpl.emoji}</span>
                      <span className="text-xs font-medium">{tpl.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
              
              {/* Title */}
              <div className="p-4 -mx-4 bg-primary/5 border-l-4 border-primary rounded-r-xl">
                <Label htmlFor="title" className="text-base font-bold text-primary flex items-center gap-2">
                  <span className="text-lg">🤔</span>
                  Vad handlar läxan om?
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="t.ex. Matte kapitel 5"
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
                <div>
                  <Label htmlFor="dueDate" className="text-sm font-medium">
                    {homeworkType === 'forhor' ? 'När är förhöret? 📅' : 'När ska den lämnas in? 📅'}
                  </Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => {
                      setDueDate(e.target.value);
                      setSelectedDays([]);
                    }}
                    min={minDate}
                    className="mt-1.5"
                  />
                </div>
              )}
              
              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  Vill du skriva något mer? 💭 (valfritt)
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
                  Vad ska tas med till skolan? 🎒
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
              
              {/* Reminder */}
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
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !canProceedStep1}
                  className="w-full"
                  size="lg"
                >
                  {loading ? 'Sparar...' : 'Skapa återkommande läxa ✨'}
                </Button>
              ) : (
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                  className="w-full"
                  size="lg"
                >
                  Nästa: Planera pluggdagar 📅
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
              {/* Smart suggestion header */}
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  {availableDays.length > 0 ? (
                    <>Du har {availableDays.length} dagar på dig. Vi föreslår {Math.min(suggestedDayCount, availableDays.length)} pluggdagar!</>
                  ) : (
                    <>Inga dagar före deadline</>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {homeworkType === 'forhor' ? 'Förhör' : 'Inlämning'}: {dueDate ? format(parseISO(dueDate), 'd MMMM', { locale: sv }) : ''}
                </p>
              </div>

              {/* Day count slider */}
              {availableDays.length > 1 && (
                <div>
                  <Label className="text-sm font-medium">
                    Antal pluggdagar: <span className="text-primary font-bold">{Math.min(suggestedDayCount, availableDays.length)}</span>
                  </Label>
                  <Slider
                    value={[suggestedDayCount]}
                    onValueChange={(val) => {
                      const count = val[0];
                      setSuggestedDayCount(count);
                      const suggested = suggestStudyDays(availableDays, taskCountsByDate, count);
                      setSelectedDays(suggested);
                    }}
                    min={1}
                    max={availableDays.length}
                    step={1}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>1 dag</span>
                    <span>{availableDays.length} dagar</span>
                  </div>
                </div>
              )}
              
              {/* Day picker with workload */}
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                {availableDays.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isSelected = selectedDays.includes(dateStr);
                  const isToday = isSameDay(day, today);
                  const isWeekendDay = isWeekend(day);
                  const existingTaskCount = taskCountsByDate[dateStr] || 0;
                  const load = getLoadLabel(existingTaskCount);
                  
                  return (
                    <motion.button
                      key={dateStr}
                      whileTap={{ scale: 0.95 }}
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
                      {/* Workload label */}
                      {existingTaskCount > 0 && !isSelected && (
                        <div className="text-[10px] mt-0.5 opacity-70">
                          {load.emoji}
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
                    </motion.button>
                  );
                })}
              </div>

              {availableDays.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Inga dagar före inlämningsdagen
                </p>
              )}
              
              {/* Legend */}
              {availableDays.length > 0 && (
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground justify-center">
                  <span>😎 Lugnt</span>
                  <span>📚 Lite</span>
                  <span>🔥 Fullt</span>
                </div>
              )}
              
              <div className="text-center text-sm font-medium">
                {selectedDays.length > 0 
                  ? <span className="text-primary">{selectedDays.length} pluggdag{selectedDays.length > 1 ? 'ar' : ''} vald{selectedDays.length > 1 ? 'a' : ''} ✨</span>
                  : <span className="text-muted-foreground">Inga dagar valda (valfritt)</span>}
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
                  {loading ? 'Sparar...' : 'Spara läxa 🎉'}
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
