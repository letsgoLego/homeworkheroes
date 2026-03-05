import { motion } from 'framer-motion';
import { Check, Trash2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { celebrateStars } from '@/lib/confetti';

interface AdhocTask {
  id: string;
  title: string;
  task_date: string;
  completed: boolean;
  completed_at?: string | null;
}

interface AdhocTaskCardProps {
  task: AdhocTask;
  onToggle: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
}

export function AdhocTaskCard({ task, onToggle, onDelete }: AdhocTaskCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        'rounded-2xl p-4 transition-all duration-300 border-2',
        task.completed
          ? 'bg-muted/50 border-muted'
          : 'bg-gradient-to-br from-celebration/10 to-celebration/5 border-celebration/30'
      )}
    >
      <div className="flex items-center gap-3">
        {/* Checkbox */}
        <button
          onClick={() => {
            const newCompleted = !task.completed;
            onToggle(task.id, newCompleted);
            if (newCompleted) celebrateStars();
          }}
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0',
            task.completed
              ? 'bg-muted text-muted-foreground'
              : 'bg-celebration/20 text-celebration hover:bg-celebration/30'
          )}
        >
          {task.completed ? (
            <Check className="w-5 h-5" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-celebration/20 text-celebration px-2 py-0.5 rounded-full font-medium">
              ⭐ Extra
            </span>
          </div>
          <h3
            className={cn(
              'font-semibold mt-1',
              task.completed && 'line-through text-muted-foreground'
            )}
          >
            {task.title}
          </h3>
        </div>

        {/* Delete button */}
        <button
          onClick={() => onDelete(task.id)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
