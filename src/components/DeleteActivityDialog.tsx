import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

const DAY_LABELS = ['sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör'];

interface DeleteActivityDialogProps {
  open: boolean;
  onClose: () => void;
  activity: {
    id: string;
    title: string;
    emoji: string;
    weekdays: number[];
    specific_date?: string | null;
  } | null;
  /** When set, the user may skip just this date instead of deleting the series */
  date?: Date;
  onDeleteSeries: (id: string) => Promise<boolean> | void;
  onSkipDate?: (id: string, date: string) => Promise<boolean> | void;
}

export function DeleteActivityDialog({
  open,
  onClose,
  activity,
  date,
  onDeleteSeries,
  onSkipDate,
}: DeleteActivityDialogProps) {
  const [loading, setLoading] = useState(false);

  if (!activity) return null;

  const days = activity.weekdays ?? [];
  const isSeries = days.length > 0;
  const seriesText = isSeries
    ? `varje ${days.map((d) => DAY_LABELS[d]).join(', ')}`
    : activity.specific_date
      ? format(new Date(activity.specific_date), 'd MMMM', { locale: sv })
      : '';

  const canSkip = isSeries && !!date && !!onSkipDate;

  const run = async (fn: () => Promise<boolean> | void) => {
    setLoading(true);
    await fn();
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-0 shadow-elevated">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {activity.emoji} Ta bort {activity.title}?
          </DialogTitle>
          <DialogDescription>
            {isSeries
              ? `Aktiviteten är en serie – den återkommer ${seriesText}.`
              : `Aktiviteten är ett enstaka tillfälle${seriesText ? ` den ${seriesText}` : ''}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {canSkip && (
            <Button
              variant="secondary"
              className="w-full h-auto py-3 flex-col gap-0.5"
              disabled={loading}
              onClick={() => run(() => onSkipDate!(activity.id, format(date!, 'yyyy-MM-dd')))}
            >
              <span className="font-semibold">Bara denna dag</span>
              <span className="text-xs opacity-80">
                Hoppa över {format(date!, 'EEEE d MMM', { locale: sv })} – serien finns kvar
              </span>
            </Button>
          )}

          <Button
            variant="destructive"
            className="w-full h-auto py-3 flex-col gap-0.5"
            disabled={loading}
            onClick={() => run(() => onDeleteSeries(activity.id))}
          >
            <span className="font-semibold">
              {isSeries ? 'Ta bort hela serien' : 'Ta bort aktiviteten'}
            </span>
            {isSeries && (
              <span className="text-xs opacity-90">Försvinner från alla dagar</span>
            )}
          </Button>

          <Button variant="ghost" className="w-full" onClick={onClose} disabled={loading}>
            Avbryt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
