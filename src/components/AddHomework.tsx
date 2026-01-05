import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Subject, SUBJECT_LABELS, SUBJECT_ICONS } from '@/types/homework';
import { useHomeworkStore } from '@/stores/homeworkStore';
import { cn } from '@/lib/utils';
import { format, addDays, isBefore, parseISO, startOfDay, isSameDay } from 'date-fns';
import { Plus, X, Calendar, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface AddHomeworkProps {
  open: boolean;
  onClose: () => void;
}

const subjects: Subject[] = ['math', 'science', 'language', 'history', 'art', 'music', 'sports', 'other'];

export function AddHomework({ open, onClose }: AddHomeworkProps) {
  const { addHomework, addTask, activeChildId } = useHomeworkStore();
  const [step, setStep] = useState(1);
  
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<Subject>('other');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [bringItems, setBringItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');
  const [tasks, setTasks] = useState<{ title: string; date: string }[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  
  const today = startOfDay(new Date());
  const minDate = format(today, 'yyyy-MM-dd');
  
  const resetForm = () => {
    setStep(1);
    setTitle('');
    setSubject('other');
    setDescription('');
    setDueDate('');
    setBringItems([]);
    setNewItem('');
    setTasks([]);
    setNewTaskTitle('');
    setNewTaskDate('');
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
  
  const addNewTask = () => {
    if (!newTaskTitle.trim() || !newTaskDate) return;
    
    const taskDate = parseISO(newTaskDate);
    const dueDateParsed = parseISO(dueDate);
    
    // Can't create tasks on due date
    if (isSameDay(taskDate, dueDateParsed)) {
      toast.error("Can't schedule tasks on the due date!");
      return;
    }
    
    // Can't create tasks after due date
    if (isBefore(dueDateParsed, taskDate)) {
      toast.error("Tasks must be before the due date!");
      return;
    }
    
    setTasks([...tasks, { title: newTaskTitle.trim(), date: newTaskDate }]);
    setNewTaskTitle('');
    setNewTaskDate('');
  };
  
  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };
  
  const handleSubmit = () => {
    if (!activeChildId) {
      toast.error("Please select a child first");
      return;
    }
    
    if (!title.trim() || !dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    const homework = addHomework({
      title: title.trim(),
      subject,
      description: description.trim() || undefined,
      dueDate,
      childId: activeChildId,
      bringToSchool: bringItems.length > 0 ? bringItems : undefined,
    });
    
    tasks.forEach((task) => {
      addTask(homework.id, {
        title: task.title,
        date: task.date,
      });
    });
    
    toast.success("Homework added! 📚");
    handleClose();
  };
  
  const canProceedStep1 = title.trim() && dueDate;
  const maxTaskDate = dueDate ? format(addDays(parseISO(dueDate), -1), 'yyyy-MM-dd') : '';
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto border-0 shadow-elevated">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {step === 1 ? 'New Homework' : 'Add Study Tasks'}
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
              {/* Title */}
              <div>
                <Label htmlFor="title" className="text-sm font-medium">
                  What's the homework?
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Math Chapter 5"
                  className="mt-1.5"
                />
              </div>
              
              {/* Subject */}
              <div>
                <Label className="text-sm font-medium">Subject</Label>
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
                  When is it due?
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={minDate}
                  className="mt-1.5"
                />
              </div>
              
              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  Notes (optional)
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Any extra details..."
                  className="mt-1.5 resize-none"
                  rows={2}
                />
              </div>
              
              {/* Bring to school */}
              <div>
                <Label className="text-sm font-medium">
                  What to bring to school?
                </Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="e.g., Workbook"
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
                Next: Add Study Tasks
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
                Break down your homework into smaller tasks. When do you want to work on it?
              </p>
              
              {/* Add task form */}
              <div className="p-3 rounded-xl bg-muted/50 space-y-3">
                <Input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="What will you do?"
                />
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={newTaskDate}
                    onChange={(e) => setNewTaskDate(e.target.value)}
                    min={minDate}
                    max={maxTaskDate}
                    className="flex-1"
                  />
                  <Button
                    onClick={addNewTask}
                    disabled={!newTaskTitle.trim() || !newTaskDate}
                    size="icon"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  📝 Tasks must be scheduled before the due date ({dueDate ? format(parseISO(dueDate), 'MMM d') : '...'})
                </p>
              </div>
              
              {/* Task list */}
              {tasks.length > 0 && (
                <div className="space-y-2">
                  {tasks.map((task, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-card shadow-soft"
                    >
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(parseISO(task.date), 'EEE, MMM d')}
                        </p>
                      </div>
                      <button
                        onClick={() => removeTask(i)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-1"
                >
                  {tasks.length > 0 ? 'Save Homework' : 'Save Without Tasks'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
