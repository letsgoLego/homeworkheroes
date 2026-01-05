import { cn } from '@/lib/utils';
import { Subject, SUBJECT_LABELS, SUBJECT_ICONS } from '@/types/homework';

interface SubjectBadgeProps {
  subject: Subject;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5',
};

export function SubjectBadge({ 
  subject, 
  size = 'md', 
  showLabel = true,
  className 
}: SubjectBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold',
        `bg-subject-${subject}/15 text-subject-${subject}`,
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: `hsl(var(--subject-${subject}) / 0.15)`,
        color: `hsl(var(--subject-${subject}))`,
      }}
    >
      <span>{SUBJECT_ICONS[subject]}</span>
      {showLabel && <span>{SUBJECT_LABELS[subject]}</span>}
    </span>
  );
}
