import { useState } from 'react';
import { Calendar as CalendarIcon, Repeat, ListTodo } from 'lucide-react';
import { format, addWeeks, eachDayOfInterval, getDay, parseISO, startOfDay } from 'date-fns';
import { sv } from 'date-fns/locale';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { celebrateTask } from '@/lib/confetti';
import { track } from '@/lib/analytics';

const WEEKDAYS = [
  { value: 1, label: 'Mån' },
  { value: 2, label: 'Tis' },
  { value: 3, label: 'Ons' },
  { value: 4, label: 'Tor' },
  { value: 5, label: 'Fre' },
  { value: 6, label: 'Lör' },
  { value: 0, label: 'Sön' },
];

interface AddTodoProps {
  open: boolean;
  onClose: () => void;
  childId: string;
  onAdd: (childId: string, title: string, taskDate: string) => Promise<boolean>;
}

export function AddTodo({ open, onClose, childId, onAdd }: AddTodoProps) {
  const today = startOfDay(new Date());
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<'once' | 'recurring'>('once');
  const [date, setDate] = useState<Date>(today);
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [weeks, setWeeks] = useState(4);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setTitle('');
    setMode('once');
    setDate(today);
    setWeekdays([1, 2, 3, 4, 5]);
    setWeeks(4);
    onClose();
  };

  const toggleWeekday = (day: number) => {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const generateDates = () => {
    const endDate = addWeeks(today, weeks);
    const allDays = eachDayOfInterval({ start: today, end: endDate });
    return allDays
      .filter((d) => weekdays.includes(getDay(d)))
      .map((d) => format(d, 'yyyy-MM-dd'));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Fyll i vad du vill göra');
      return;
    }
    if (mode === 'recurring' && weekdays.length === 0) {
      toast.error('Välj minst en dag');
      return;
    }
    setLoading(true);

    if (mode === 'once') {
      const ok = await onAdd(childId, title.trim(), format(date, 'yyyy-MM-dd'));
      if (ok) {
        celebrateTask();
        handleClose();
      }
    } else {
      const dates = generateDates();
      let success = 0;
      for (const d of dates) {
        const ok = await onAdd(childId, title.trim(), d);
        if (ok) success++;
      }
      if (success > 0) {
        toast.success(`${success} uppgifter planerade ⭐`);
        celebrateTask();
        handleClose();
      }
    }

    setLoading(false);
  };

  const recurringCount = mode === 'recurring' ? generateDates().length : 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-celebration" />
            Ny todo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label className="text-sm font-medium">Vad ska göras?</Label>
            <Input
              placeholder="T.ex. Städa rummet, Öva piano..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="mt-1.5"
            />
          </div>

          {/* Mode toggle */}
          <div>
            <Label className="text-sm font-medium">Hur ofta?</Label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              <button
                onClick={() => setMode('once')}
                className={cn(
                  'flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-medium transition-all',
                  mode === 'once'
                    ? 'bg-primary text-primary-foreground shadow-glow-primary'
                    : 'bg-muted hover:bg-muted/80'
                )}
              >
                <CalendarIcon className="w-4 h-4" />
                Engångs
              </button>
              <button
                onClick={() => setMode('recurring')}
                className={cn(
                  'flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-medium transition-all',
                  mode === 'recurring'
                    ? 'bg-primary text-primary-foreground shadow-glow-primary'
                    : 'bg-muted hover:bg-muted/80'
                )}
              >
                <Repeat className="w-4 h-4" />
                Återkommande
              </button>
            </div>
          </div>

          {/* One-off date picker */}
          {mode === 'once' && (
            <div>
              <Label className="text-sm font-medium">Vilken dag?</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal mt-1.5"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(date, 'EEEE d MMMM', { locale: sv })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    disabled={(d) => d < today}
                    initialFocus
                    className={cn('p-3 pointer-events-auto')}
                    locale={sv}
                    weekStartsOn={1}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Recurring config */}
          {mode === 'recurring' && (
            <>
              <div>
                <Label className="text-sm font-medium">Vilka dagar?</Label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {WEEKDAYS.map((day) => (
                    <button
                      key={day.value}
                      onClick={() => toggleWeekday(day.value)}
                      className={cn(
                        'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                        weekdays.includes(day.value)
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
                <Label className="text-sm font-medium">Hur länge?</Label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {[2, 4, 8, 12].map((w) => (
                    <button
                      key={w}
                      onClick={() => setWeeks(w)}
                      className={cn(
                        'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                        weeks === w
                          ? 'bg-primary text-primary-foreground shadow-glow-primary'
                          : 'bg-muted hover:bg-muted/80'
                      )}
                    >
                      {w} veckor
                    </button>
                  ))}
                </div>
                {recurringCount > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Det blir {recurringCount} uppgifter (t.o.m.{' '}
                    {format(addWeeks(today, weeks), 'd MMM yyyy', { locale: sv })})
                  </p>
                )}
              </div>
            </>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Avbryt
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="flex-1">
              {loading ? 'Lägger till...' : 'Lägg till ⭐'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
