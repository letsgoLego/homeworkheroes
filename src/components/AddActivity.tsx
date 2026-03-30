import { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { celebrateTask } from '@/lib/confetti';

interface AddActivityProps {
  open: boolean;
  onClose: () => void;
  onAdd: (activity: {
    title: string;
    emoji: string;
    weekdays: number[];
    specificDate?: string;
    startTime?: string;
    endTime?: string;
  }) => Promise<boolean>;
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

export function AddActivity({ open, onClose, onAdd }: AddActivityProps) {
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

    setLoading(true);
    const success = await onAdd({
      title: title.trim(),
      emoji,
      weekdays: isRecurring ? weekdays : [],
      specificDate: !isRecurring ? specificDate : undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
    });

    if (success) {
      celebrateTask();
      handleClose();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto border-0 shadow-elevated">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            🏃 Ny aktivitet
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

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Sparar...' : 'Lägg till aktivitet 🎉'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
