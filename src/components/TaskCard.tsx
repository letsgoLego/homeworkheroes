import { motion } from 'framer-motion';
import { Check, Moon } from 'lucide-react';
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
  onSnooze?: (taskId: string) => Promise<boolean>;
  onUnsnooze?: (taskId: string) => Promise<boolean>;
  isSnoozed?: boolean;
}

export function TaskCard({ task, homework, onToggle, onSnooze, onUnsnooze, isSnoozed = false }: TaskCardProps) {
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedHomework, setCompletedHomework] = useState<Homework | null>(null);
  const { refetch } = useFamily();
  
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
      await onSnooze(task.id);
    }
  };
  
  const handleUnsnooze = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUnsnooze) {
      await onUnsnooze(task.id);
    }
  };
  
  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'group relative overflow-hidden rounded-2xl p-4 shadow-card transition-all duration-200',
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
            <div className="flex items-center gap-2 mb-1">
              <SubjectBadge subject={homework.subject} size="sm" />
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
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSnooze}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted"
                  title="Snooze till imorgon"
                >
                  <span className="text-base">💤</span>
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
      
      <CompletionModal
        open={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        homework={completedHomework}
        onComplete={refetch}
      />
    </>
  );
}
