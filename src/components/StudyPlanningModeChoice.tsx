import { CalendarDays, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type StudyPlanningMode = 'manual' | 'template';

interface StudyPlanningModeChoiceProps {
  value: StudyPlanningMode | null;
  onChange: (value: StudyPlanningMode) => void;
}

export function StudyPlanningModeChoice({ value, onChange }: StudyPlanningModeChoiceProps) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold">Hur vill du planera?</h3>
        <p className="text-sm text-muted-foreground">Du kan gå tillbaka och byta utan att läxans uppgifter försvinner.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onChange('manual')}
          className={cn(
            'h-auto min-h-28 items-start justify-start gap-3 whitespace-normal p-4 text-left',
            value === 'manual' && 'border-primary bg-primary/10 ring-1 ring-primary'
          )}
        >
          <CalendarDays className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
          <span>
            <span className="block font-semibold">Välj dagar själv</span>
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              Välj fritt bland dagarna och se läxor och aktiviteter.
            </span>
          </span>
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onChange('template')}
          className={cn(
            'h-auto min-h-28 items-start justify-start gap-3 whitespace-normal p-4 text-left',
            value === 'template' && 'border-primary bg-primary/10 ring-1 ring-primary'
          )}
        >
          <ListChecks className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
          <span>
            <span className="block font-semibold">Följ en mall</span>
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              Få föreslagna moment och välj en eller flera dagar för varje.
            </span>
          </span>
        </Button>
      </div>
    </div>
  );
}