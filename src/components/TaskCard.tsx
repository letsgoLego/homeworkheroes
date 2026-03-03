import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Check, Moon, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StudyTask, Homework } from '@/types/homework';
import { SubjectBadge } from './ui/SubjectBadge';
import { celebrateTask, celebrateAssignment } from '@/lib/confetti';
import { useState } from 'react';
import { CompletionModal } from './CompletionModal';
import { useFamily } from '@/hooks/useFamily';
import { Button } from './ui/button';

interface TaskCardProps {
  task: StudyTask;
  homework: Homework;
  onToggle: (taskId: string, completed: boolean) => Promise<{ allCompleted: boolean; homework: any }>;
  onSnooze?: (taskId: string, homeworkDueDate?: string) => Promise<boolean>;
  onUnsnooze?: (taskId: string) => Promise<boolean>;
  onDelete?: (taskId: string) => Promise<boolean>;
  isSnoozed?: boolean;
  wasSnoozed?: boolean;
  canSnooze?: boolean;
  daysOld?: number;
}

export function TaskCard({ task, homework, onToggle, onSnooze, onUnsnooze, onDelete, isSnoozed = false, wasSnoozed = false, canSnooze = true, daysOld = 0 }: TaskCardProps) {
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedHomework, setCompletedHomework] = useState<Homework | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { refetch } = useFamily();
  
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-120, -60], [1, 0]);
  const deleteScale = useTransform(x, [-120, -60, 0], [1, 0.8, 0.5]);
  
  const handleToggle = async () => {
    const newCompleted = !task.completed;
    const result = await onToggle(task.id, newCompleted);
    
    if (newCompleted) {
      if (result.allCompleted && result.homework) {
        celebrateAssignment();
        setCompletedHomework(homework);
        setShowCompletionModal(true);
      } else {
        celebrateTask();
      }
    }
  };
  
  const handleSnooze = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSnooze) {
      await onSnooze(task.id, homework.dueDate);
    }
  };
  
  const handleUnsnooze = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUnsnooze) {
      await onUnsnooze(task.id);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || isDeleting) return;
    setIsDeleting(true);
    await onDelete(task.id);
    setIsDeleting(false);
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -100) {
      handleDelete();
    }
  };
  
  return (
    <>
      <div className="relative overflow-hidden rounded-2xl">
        {/* Delete background */}
        <motion.div
          style={{ opacity: deleteOpacity, scale: deleteScale }}
          className="absolute inset-0 flex items-center justify-end pr-6 bg-destructive rounded-2xl"
        >
          <div className="flex items-center gap-2 text-destructive-foreground">
            <Trash2 className="w-5 h-5" />
            <span className="font-medium text-sm">Ta bort</span>
          </div>
        </motion.div>

        {/* Draggable card */}
        <motion.div
          layout
          style={{ x }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={{ left: 0.5, right: 0 }}
          onDragEnd={handleDragEnd}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -200 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'group relative overflow-hidden rounded-2xl p-4 shadow-card transition-colors duration-200',
            task.completed
              ? 'bg-success/10 border-2 border-success/30'
              : isSnoozed
              ? 'bg-muted/50 border-2 border-muted-foreground/20'
              : 'bg-card border-2 border-transparent hover:border-primary/20'
          )}
        >
          <div className="flex items-start gap-4">
            <button
              onClick={handleToggle}
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200',
                task.completed
                  ? 'bg-success border-success text-success-foreground'
                  : 'border-muted-foreground/30 hover:border-primary hover:bg-primary/10'
              )}
            >
              {task.completed && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  <Check className="h-5 w-5" />
                </motion.div>
              )}
            </button>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <SubjectBadge subject={homework.subject} size="sm" />
                {daysOld > 0 && !task.completed && !isSnoozed && (
                  <span className="text-xs bg-destructive/10 px-2 py-0.5 rounded-full text-destructive flex items-center gap-1">
                    ⏳ {daysOld} {daysOld === 1 ? 'dag' : 'dagar'} sedan
                  </span>
                )}
                {wasSnoozed && !isSnoozed && daysOld === 0 && (
                  <span className="text-xs bg-primary/10 px-2 py-0.5 rounded-full text-primary flex items-center gap-1">
                    🔔 Från igår
                  </span>
                )}
                {isSnoozed && (
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground flex items-center gap-1">
                    <Moon className="w-3 h-3" />
                    Snoozad
                  </span>
                )}
              </div>
              <h3
                className={cn(
                  'font-semibold text-lg transition-all',
                  (task.completed || isSnoozed) && 'line-through text-muted-foreground'
                )}
              >
                {task.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {homework.title}
              </p>
            </div>
            
            {/* Snooze/Unsnooze button */}
            {!task.completed && (
              <div className="shrink-0">
                {isSnoozed ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUnsnooze}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Vakna
                  </Button>
                ) : canSnooze ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSnooze}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted"
                    title="Snooze till imorgon"
                  >
                    <span className="text-base">💤</span>
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled
                    className="text-muted-foreground/50 cursor-not-allowed"
                    title="Kan inte snooza förbi deadline"
                  >
                    <span className="text-base opacity-50">💤</span>
                  </Button>
                )}
              </div>
            )}
          </div>
          
          {/* Completion glow effect */}
          {task.completed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-gradient-to-r from-success/5 to-transparent pointer-events-none"
            />
          )}
          
          {/* Snoozed overlay effect */}
          {isSnoozed && !task.completed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-gradient-to-r from-muted/10 to-transparent pointer-events-none"
            />
          )}
        </motion.div>
      </div>
      
      <CompletionModal
        open={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        homework={completedHomework}
        onComplete={refetch}
      />
    </>
  );
}
