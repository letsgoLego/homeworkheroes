import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Subject, SUBJECT_LABELS, SUBJECT_ICONS } from '@/types/homework';
import { useFamily } from '@/hooks/useFamily';
import { cn } from '@/lib/utils';
import { format, addDays, parseISO, startOfDay, eachDayOfInterval, isWeekend, isSameDay } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Plus, X, ArrowRight, Check, User } from 'lucide-react';
import { toast } from 'sonner';

interface AddHomeworkProps {
  open: boolean;
  onClose: () => void;
}

const subjects: Subject[] = ['math', 'science', 'language', 'history', 'art', 'music', 'sports', 'other'];

export function AddHomework({ open, onClose }: AddHomeworkProps) {
  const { addHomework, addTask, activeChildId, children, setActiveChildId } = useFamily();
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
  
  const today = startOfDay(new Date());
  const minDate = format(today, 'yyyy-MM-dd');
  
  // Generate available days between today and due date
  const availableDays = useMemo(() => {
    if (!dueDate) return [];
    const dueDateParsed = parseISO(dueDate);
    const days = eachDayOfInterval({ start: today, end: addDays(dueDateParsed, -1) });
    return days.filter(day => !isWeekend(day)); // Exclude weekends by default
  }, [dueDate, today]);
  
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
  
  const selectAllWeekdays = () => {
    const weekdayDates = availableDays.map(d => format(d, 'yyyy-MM-dd'));
    setSelectedDays(weekdayDates);
  };
  
  const selectEveryOtherDay = () => {
    const everyOther = availableDays
      .filter((_, i) => i % 2 === 0)
      .map(d => format(d, 'yyyy-MM-dd'));
    setSelectedDays(everyOther);
  };
  
  const handleSubmit = async () => {
    if (!targetChildId) {
      toast.error("Välj ett barn först");
      return;
    }
    
    if (!title.trim() || !dueDate) {
      toast.error("Fyll i alla obligatoriska fält");
      return;
    }
    
    setLoading(true);
    
    const homework = await addHomework({
      title: title.trim(),
      subject,
      description: description.trim() || undefined,
      dueDate,
      childId: targetChildId,
      bringToSchool: bringItems.length > 0 ? bringItems : undefined,
    });
    
    if (homework) {
      // Add tasks for selected days
      for (const dateStr of selectedDays.sort()) {
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
  
  const canProceedStep1 = title.trim() && dueDate;
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto border-0 shadow-elevated">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {step === 1 ? 'Ny läxa' : 'När ska du plugga?'}
          </DialogTitle>
        </DialogHeader>
        
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
              <div>
                <Label htmlFor="title" className="text-sm font-medium">
                  Vad är läxan?
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="t.ex. Matte kapitel 5"
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
              
              {/* Due Date */}
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
              
              <Button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="w-full"
                size="lg"
              >
                Nästa: Välj pluggdagar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
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
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={selectAllWeekdays}
                  className="flex-1"
                >
                  Alla vardagar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={selectEveryOtherDay}
                  className="flex-1"
                >
                  Varannan dag
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
                  
                  return (
                    <button
                      key={dateStr}
                      onClick={() => toggleDay(dateStr)}
                      className={cn(
                        'relative p-3 rounded-xl text-center transition-all',
                        isSelected 
                          ? 'bg-primary text-primary-foreground shadow-glow-primary' 
                          : 'bg-muted hover:bg-muted/80',
                        isToday && !isSelected && 'ring-2 ring-primary/50'
                      )}
                    >
                      <div className="text-xs font-medium capitalize">
                        {format(day, 'EEE', { locale: sv })}
                      </div>
                      <div className="text-lg font-bold">
                        {format(day, 'd')}
                      </div>
                      <div className="text-xs opacity-70">
                        {format(day, 'MMM', { locale: sv })}
                      </div>
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
                  Inga vardagar före inlämningsdagen
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
  );
}
