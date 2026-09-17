import { CalendarDays, Check, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type StudyPlanningMode = 'manual' | 'template';

interface StudyPlanningModeChoiceProps {
  value: StudyPlanningMode | null;
  onChange: (value: StudyPlanningMode) => void;
  /** When true and a mode is picked, render a compact row instead of the two cards. */
  collapsible?: boolean;
  onReset?: () => void;
}

const LABELS: Record<StudyPlanningMode, string> = {
  manual: 'Välj dagar själv',
  template: 'Få hjälp att planera',
};

export function StudyPlanningModeChoice({ value, onChange, collapsible, onReset }: StudyPlanningModeChoiceProps) {
  if (collapsible && value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2">
        <span className="flex min-w-0 items-center gap-2 text-sm">
          {value === 'manual' ? (
            <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
          ) : (
            <ListChecks className="h-4 w-4 shrink-0 text-primary" />
          )}
          <span className="truncate">
            <span className="text-muted-foreground">Planeringssätt: </span>
            <span className="font-medium">{LABELS[value]}</span>
          </span>
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={onReset}>
          Byt
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold">Hur vill du planera?</h3>
        <p className="text-sm text-muted-foreground">Välj själv eller låt appen föreslå ett upplägg.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {(['manual', 'template'] as StudyPlanningMode[]).map(mode => {
          const selected = value === mode;
          const Icon = mode === 'manual' ? CalendarDays : ListChecks;
          return (
            <Button
              key={mode}
              type="button"
              variant="outline"
              onClick={() => onChange(mode)}
              className={cn(
                'h-auto min-h-28 items-start justify-start gap-3 whitespace-normal border-border bg-muted/30 p-4 text-left',
                selected && 'border-primary bg-primary/10 ring-1 ring-primary'
              )}
            >
              <Icon className={cn('mt-0.5 h-6 w-6 shrink-0', selected ? 'text-primary' : 'text-muted-foreground')} />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{LABELS[mode]}</span>
                <span className="mt-1 block text-xs font-normal text-muted-foreground">
                  {mode === 'manual'
                    ? 'Markera dagarna direkt i kalendern.'
                    : 'Appen föreslår moment och dagar åt dig.'}
                </span>
              </span>
              {selected && (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3.5 w-3.5" />
                </span>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
