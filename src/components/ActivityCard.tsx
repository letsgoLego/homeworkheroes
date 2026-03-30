import { motion } from 'framer-motion';
import { Trash2, Clock } from 'lucide-react';

interface ActivityCardProps {
  activity: {
    id: string;
    title: string;
    emoji: string;
    start_time?: string | null;
    end_time?: string | null;
  };
  onDelete?: (id: string) => void;
  compact?: boolean;
}

function formatTime(time: string | null | undefined): string {
  if (!time) return '';
  return time.slice(0, 5); // "HH:MM"
}

export function ActivityCard({ activity, onDelete, compact }: ActivityCardProps) {
  const hasTime = activity.start_time || activity.end_time;
  const timeStr = hasTime
    ? [formatTime(activity.start_time), formatTime(activity.end_time)].filter(Boolean).join('–')
    : null;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{activity.emoji}</span>
        <span className="truncate">{activity.title}</span>
        {timeStr && <span>{timeStr}</span>}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-accent/20 border border-accent/30"
    >
      <span className="text-2xl">{activity.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{activity.title}</p>
        {timeStr && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeStr}
          </p>
        )}
      </div>
      {onDelete && (
        <button
          onClick={() => onDelete(activity.id)}
          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}
