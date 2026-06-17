import { useState } from 'react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Palmtree, X, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useHolidayMode } from '@/hooks/useHolidayMode';
import { cn } from '@/lib/utils';

export function HolidayToggle({ childId }: { childId: string }) {
  const { mode, isActive, startHoliday, endHoliday } = useHolidayMode(childId);
  const [open, setOpen] = useState(false);
  const [endDate, setEndDate] = useState<Date | undefined>();

  const handleStart = async () => {
    const ok = await startHoliday(endDate ? format(endDate, 'yyyy-MM-dd') : null);
    if (ok) {
      setOpen(false);
      setEndDate(undefined);
    }
  };

  const handleEnd = async () => {
    await endHoliday();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start gap-3 h-auto py-3 rounded-2xl',
            isActive && 'border-celebration bg-celebration/10 hover:bg-celebration/20'
          )}
        >
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center text-xl',
            isActive ? 'bg-celebration/30' : 'bg-muted'
          )}>
            🌴
          </div>
          <div className="flex-1 text-left">
            <div className="font-semibold">{isActive ? 'Lovläge aktivt' : 'Lovläge'}</div>
            <div className="text-xs text-muted-foreground font-normal">
              {isActive
                ? mode?.ends_at
                  ? `T.o.m. ${format(new Date(mode.ends_at), 'd MMM', { locale: sv })}`
                  : 'Pågående'
                : 'Pausa läxor och sätt egna mål'}
            </div>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palmtree className="w-5 h-5 text-celebration" />
            {isActive ? 'Lovläge' : 'Starta lovläge'}
          </DialogTitle>
        </DialogHeader>

        {isActive ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              När du avslutar lovet visas dina vanliga läxor och aktiviteter igen.
              Dina lovmål och resultat sparas.
            </p>
            <Button onClick={handleEnd} variant="destructive" className="w-full">
              <X className="w-4 h-4 mr-2" />
              Avsluta lovläge
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Lovläget pausar vanliga läxnotifikationer och döljer läxor. Istället
              sätter du upp 1–3 egna mål att jobba mot på lovet.
            </p>

            <div className="space-y-2">
              <label className="text-sm font-medium">Slutdatum (valfritt)</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {endDate ? format(endDate, 'd MMMM yyyy', { locale: sv }) : 'Inget slutdatum'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    locale={sv}
                    className={cn('p-3 pointer-events-auto')}
                  />
                </PopoverContent>
              </Popover>
              {endDate && (
                <Button variant="ghost" size="sm" onClick={() => setEndDate(undefined)}>
                  Ta bort slutdatum
                </Button>
              )}
            </div>

            <Button onClick={handleStart} className="w-full">
              🌴 Starta lovet
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
