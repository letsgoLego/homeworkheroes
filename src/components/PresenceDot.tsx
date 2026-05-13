import { cn } from '@/lib/utils';
import { presenceStatus, PRESENCE_COLOR, PRESENCE_LABEL } from '@/hooks/useChildPresence';

interface PresenceDotProps {
  lastSeenAt: string | null | undefined;
  hasAccount: boolean;
  className?: string;
}

export function PresenceDot({ lastSeenAt, hasAccount, className }: PresenceDotProps) {
  const status = presenceStatus(lastSeenAt, hasAccount);
  return (
    <span
      title={PRESENCE_LABEL[status]}
      aria-label={PRESENCE_LABEL[status]}
      className={cn(
        'inline-block w-2.5 h-2.5 rounded-full ring-2 ring-background',
        PRESENCE_COLOR[status],
        status === 'online' && 'animate-pulse',
        className
      )}
    />
  );
}
