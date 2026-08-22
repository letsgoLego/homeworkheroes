import { motion } from 'framer-motion';
import { Trash2, Clock, Pencil, Repeat, Calendar } from 'lucide-react';

interface ActivityCardProps {
  activity: {
    id: string;
    title: string;
    emoji: string;
    weekdays?: number[];
    specific_date?: string | null;
    start_time?: string | null;
    end_time?: string | null;
  };
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  compact?: boolean;
  showSchedule?: boolean;
}

const DAY_LABELS = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];

function formatTime(time: string | null | undefined): string {
  if (!time) return '';
  return time.slice(0, 5); // "HH:MM"
}

export function ActivityCard({ activity, onDelete, onEdit, compact, showSchedule }: ActivityCardProps) {
  const hasTime = activity.start_time || activity.end_time;
  const timeStr = hasTime
    ? [formatTime(activity.start_time), formatTime(activity.end_time)].filter(Boolean).join('–')
    : null;

  const days = activity.weekdays ?? [];
  const scheduleStr = days.length > 0
    ? days.map((d) => DAY_LABELS[d]).join(', ')
    : activity.specific_date || null;

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
        <div className="flex items-center gap-3 flex-wrap">
          {timeStr && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeStr}
            </p>
          )}
          {showSchedule && scheduleStr && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {days.length > 0 ? <Repeat className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
              {scheduleStr}
            </p>
          )}
        </div>
      </div>
      {onEdit && (
        <button
          onClick={() => onEdit(activity.id)}
          aria-label="Redigera aktivitet"
          title="Redigera aktivitet"
          className="p-1 text-muted-foreground hover:text-primary transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>
      )}
      {onDelete && (
        <button
          onClick={() => onDelete(activity.id)}
          aria-label="Ta bort aktivitet"
          title="Ta bort aktivitet"
          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}
