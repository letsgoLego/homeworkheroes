import { cn } from '@/lib/utils';
import type { Activity } from '@/hooks/queries/useHomeworkData';

interface DayLoadIndicatorProps {
  homeworkCount: number;
  activities: Activity[];
  className?: string;
}

function levelClass(count: number) {
  if (count === 0) return 'bg-success';
  if (count <= 2) return 'bg-warning';
  return 'bg-destructive';
}

export function DayLoadIndicator({ homeworkCount, activities, className }: DayLoadIndicatorProps) {
  const dots = Math.min(homeworkCount, 3);
  const extra = homeworkCount - dots;
  const dotClass = levelClass(homeworkCount + activities.length);

  return (
    <span className={cn('flex flex-wrap items-center gap-x-2 gap-y-1 text-xs', className)}>
      <span className="flex items-center gap-1">
        {homeworkCount === 0 ? (
          <span className={cn('h-2 w-2 rounded-full', dotClass)} />
        ) : (
          Array.from({ length: dots }).map((_, index) => (
            <span key={index} className={cn('h-2 w-2 rounded-full', dotClass)} />
          ))
        )}
        {extra > 0 && <span className="text-muted-foreground">+{extra}</span>}
        <span className="ml-0.5 font-medium">
          {homeworkCount === 0 ? 'Inga läxor' : `${homeworkCount} läx${homeworkCount === 1 ? 'a' : 'or'}`}
        </span>
      </span>
      {activities.map(activity => (
        <span
          key={activity.id}
          className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-normal text-muted-foreground"
        >
          {activity.emoji || '📌'} {activity.start_time ? activity.start_time.slice(0, 5) : activity.title}
        </span>
      ))}
    </span>
  );
}
