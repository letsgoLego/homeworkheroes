import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { celebrateTask } from '@/lib/confetti';


export interface ActivityFormData {
  title: string;
  emoji: string;
  weekdays: number[];
  specificDate?: string;
  startTime?: string;
  endTime?: string;
}

interface EditableActivity {
  id: string;
  title: string;
  emoji: string;
  weekdays: number[];
  specific_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
}

interface AddActivityProps {
  open: boolean;
  onClose: () => void;
  onAdd?: (activity: ActivityFormData) => Promise<boolean>;
  /** When set, the dialog works in edit mode */
  activity?: EditableActivity | null;
  onUpdate?: (id: string, activity: ActivityFormData) => Promise<boolean>;
}

const EMOJI_OPTIONS = [
  { emoji: '⚽', label: 'Fotboll' },
  { emoji: '🎹', label: 'Piano' },
  { emoji: '🏊', label: 'Simning' },
  { emoji: '🎭', label: 'Teater' },
  { emoji: '🏀', label: 'Basket' },
  { emoji: '🎨', label: 'Konst' },
  { emoji: '🤸', label: 'Gymnastik' },
  { emoji: '🎸', label: 'Gitarr' },
  { emoji: '🥋', label: 'Kampsport' },
  { emoji: '💃', label: 'Dans' },
  { emoji: '🏒', label: 'Hockey' },
  { emoji: '🐴', label: 'Ridning' },
  { emoji: '🏓', label: 'Bordtennis' },
  { emoji: '⛸️', label: 'Konståkning' },
  { emoji: '🎯', label: 'Övrigt' },
];

const WEEKDAYS = [
  { value: 1, label: 'Mån' },
  { value: 2, label: 'Tis' },
  { value: 3, label: 'Ons' },
  { value: 4, label: 'Tor' },
  { value: 5, label: 'Fre' },
  { value: 6, label: 'Lör' },
  { value: 0, label: 'Sön' },
];

export function AddActivity({ open, onClose, onAdd, activity, onUpdate }: AddActivityProps) {
  const isEdit = !!activity;
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('⚽');
  const [isRecurring, setIsRecurring] = useState(true);
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [specificDate, setSpecificDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setTitle('');
    setEmoji('⚽');
    setIsRecurring(true);
    setWeekdays([]);
    setSpecificDate('');
    setStartTime('');
    setEndTime('');
  };

  // Prefill when opening in edit mode
  useEffect(() => {
    if (open && activity) {
      setTitle(activity.title);
      setEmoji(activity.emoji || '⚽');
      const days = activity.weekdays || [];
      setIsRecurring(days.length > 0 || !activity.specific_date);
      setWeekdays(days);
      setSpecificDate(activity.specific_date || '');
      setStartTime(activity.start_time?.slice(0, 5) || '');
      setEndTime(activity.end_time?.slice(0, 5) || '');
    }
    if (open && !activity) {
      resetForm();
    }
  }, [open, activity]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const toggleDay = (day: number) => {
    setWeekdays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  const handleEmojiSelect = (e: string, label: string) => {
    setEmoji(e);
    if (!title) setTitle(label);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Ge aktiviteten ett namn');
      return;
    }
    if (isRecurring && weekdays.length === 0) {
      toast.error('Välj minst en dag');
      return;
    }
    if (!isRecurring && !specificDate) {
      toast.error('Välj ett datum');
      return;
    }

    const payload: ActivityFormData = {
      title: title.trim(),
      emoji,
      weekdays: isRecurring ? weekdays : [],
      specificDate: !isRecurring ? specificDate : undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
    };

    setLoading(true);
    const success = isEdit
      ? await onUpdate?.(activity!.id, payload)
      : await onAdd?.(payload);

    if (success) {
      if (!isEdit) celebrateTask();
      handleClose();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto border-0 shadow-elevated">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            {isEdit ? '✏️ Redigera aktivitet' : '🏃 Ny aktivitet'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Emoji picker */}
          <div>
            <Label className="text-sm font-medium">Välj en ikon</Label>
            <div className="grid grid-cols-6 gap-2 mt-1.5">
              {EMOJI_OPTIONS.map((opt) => (
                <motion.button
                  key={opt.emoji}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleEmojiSelect(opt.emoji, opt.label)}
                  className={cn(
                    'flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all',
                    emoji === opt.emoji
                      ? 'bg-primary text-primary-foreground shadow-glow-primary'
                      : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  <span className="text-xl">{opt.emoji}</span>
                  <span className="text-[10px] font-medium truncate w-full text-center">{opt.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="activity-title" className="text-sm font-medium">
              Vad heter aktiviteten? 🤔
            </Label>
            <Input
              id="activity-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="t.ex. Fotbollsträning"
              className="mt-1.5 h-12 text-base"
            />
          </div>

          {/* Recurring toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div>
              <p className="text-sm font-medium">Återkommande</p>
              <p className="text-xs text-muted-foreground">
                Samma dag varje vecka
              </p>
            </div>
            <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
          </div>

          {isRecurring ? (
            <div>
              <Label className="text-sm font-medium">Vilka dagar?</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {WEEKDAYS.map((day) => (
                  <button
                    key={day.value}
                    onClick={() => toggleDay(day.value)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-all',
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
          ) : (
            <div>
              <Label htmlFor="activity-date" className="text-sm font-medium">
                Vilket datum?
              </Label>
              <Input
                id="activity-date"
                type="date"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
                className="mt-1.5"
              />
            </div>
          )}

          {/* Time inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="start-time" className="text-sm font-medium">
                Starttid (valfri)
              </Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="end-time" className="text-sm font-medium">
                Sluttid (valfri)
              </Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          {/* Series controls (edit mode only) */}
          {isEdit && (
            <div className="space-y-3 p-3 rounded-xl bg-muted/50">
              <p className="text-xs text-muted-foreground">
                ℹ️ Ändringarna gäller <strong>hela serien</strong> – alla tillfällen uppdateras.
              </p>

              {isRecurring && (
                <div>
                  <Label htmlFor="activity-end-date" className="text-sm font-medium">
                    Pågår t.o.m. (valfritt)
                  </Label>
                  <Input
                    id="activity-end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Avsluta serien istället för att ta bort den.
                  </p>
                </div>
              )}

              {skippedDates.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Hoppade dagar</Label>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {skippedDates.map((d) => (
                      <button
                        key={d}
                        onClick={() => setSkippedDates(prev => prev.filter(x => x !== d))}
                        className="px-3 py-1.5 rounded-lg bg-background text-xs font-medium flex items-center gap-1 hover:bg-destructive/10"
                        title="Ta tillbaka dagen"
                      >
                        {format(new Date(d), 'd MMM', { locale: sv })}
                        <X className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Klicka på ett datum för att ta tillbaka aktiviteten den dagen.
                  </p>
                </div>
              )}
            </div>
          )}



          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Sparar...' : isEdit ? 'Spara ändringar' : 'Lägg till aktivitet 🎉'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
