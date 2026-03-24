import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Backpack, Flag, Check, BookOpen } from 'lucide-react';
import { SubjectBadge } from './ui/SubjectBadge';
import { Homework, HOMEWORK_TYPE_LABELS, Subject, HomeworkType } from '@/types/homework';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface RecurringPackItem {
  id: string;
  child_id: string;
  item_name: string;
  weekdays: number[];
  created_at: string;
}

interface HomeworkDueItem {
  id: string;
  title: string;
  subject: string;
  homework_type: string;
  completed: boolean;
  tasks: { id: string; completed: boolean }[];
  bring_to_school: string[] | null;
}

interface BringToSchoolProps {
  items: { homework: Homework; items: string[] }[];
  recurringItems?: RecurringPackItem[];
  packDate?: Date;
  /** Homework due on the pack date (for checking off submissions) */
  homeworkDue?: HomeworkDueItem[];
  onToggleHomeworkComplete?: (homeworkId: string, completed: boolean) => void;
}

function getPackSessionKey(packDate?: Date): string {
  const d = packDate || new Date();
  return `pack-checked-${format(d, 'yyyy-MM-dd')}`;
}

function getCheckedItems(sessionKey: string): Set<string> {
  try {
    const stored = localStorage.getItem(sessionKey);
    if (stored) return new Set(JSON.parse(stored));
  } catch {}
  return new Set();
}

function saveCheckedItems(sessionKey: string, items: Set<string>) {
  localStorage.setItem(sessionKey, JSON.stringify([...items]));
}

export function BringToSchool({ items, recurringItems = [], packDate, homeworkDue = [], onToggleHomeworkComplete }: BringToSchoolProps) {
  const sessionKey = getPackSessionKey(packDate);
  const [checked, setChecked] = useState<Set<string>>(() => getCheckedItems(sessionKey));

  useEffect(() => {
    setChecked(getCheckedItems(sessionKey));
  }, [sessionKey]);

  const toggleItem = useCallback((itemId: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      saveCheckedItems(sessionKey, next);
      if (navigator.vibrate) navigator.vibrate(10);
      return next;
    });
  }, [sessionKey]);

  const hasPackItems = items.length > 0 || recurringItems.length > 0;
  const hasHomeworkDue = homeworkDue.length > 0;

  if (!hasPackItems && !hasHomeworkDue) return null;

  // Count pack items
  const totalPackItems = items.reduce((sum, { items: il }) => sum + il.length, 0) + recurringItems.length;
  const packCheckedCount = [...checked].filter(id => id.startsWith('hw-') || id.startsWith('rec-')).length;
  const allPackChecked = packCheckedCount >= totalPackItems && totalPackItems > 0;

  // Homework due counts
  const totalHomeworkDue = homeworkDue.length;
  const completedHomeworkDue = homeworkDue.filter(hw => hw.completed).length;
  const allHomeworkDone = completedHomeworkDue >= totalHomeworkDue && totalHomeworkDue > 0;

  const allDone = (totalPackItems === 0 || allPackChecked) && (totalHomeworkDue === 0 || allHomeworkDone);

  return (
    <div className="space-y-4">
      {/* Homework to submit */}
      {hasHomeworkDue && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-2xl border-2 p-4 shadow-soft transition-colors",
            allHomeworkDone
              ? "bg-success/10 border-success/30"
              : "bg-card border-border"
          )}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
              allHomeworkDone ? "bg-success/20" : "bg-primary/10"
            )}>
              {allHomeworkDone ? (
                <Check className="w-5 h-5 text-success" />
              ) : (
                <BookOpen className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">Att lämna in</h3>
            </div>
            {totalHomeworkDue > 0 && (
              <span className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                allHomeworkDone
                  ? "bg-success/20 text-success"
                  : "bg-muted text-muted-foreground"
              )}>
                {completedHomeworkDue}/{totalHomeworkDue}
              </span>
            )}
          </div>

          <ul className="space-y-2">
            {homeworkDue.map((hw) => {
              const tasksComplete = hw.tasks.filter(t => t.completed).length;
              const totalTasks = hw.tasks.length;
              return (
                <li
                  key={hw.id}
                  onClick={() => onToggleHomeworkComplete?.(hw.id, !hw.completed)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all active:scale-[0.98]",
                    hw.completed
                      ? "bg-success/5 text-muted-foreground/60"
                      : "bg-muted/30 hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all",
                    hw.completed
                      ? "bg-success border-success"
                      : "border-muted-foreground/30"
                  )}>
                    {hw.completed && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <SubjectBadge subject={hw.subject as Subject} size="sm" showLabel={false} />
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-medium text-sm truncate", hw.completed && "line-through")}>{hw.title}</p>
                    {totalTasks > 0 && (
                      <p className="text-xs text-muted-foreground">{tasksComplete}/{totalTasks} uppgifter klara</p>
                    )}
                  </div>
                  {hw.homework_type && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                      <Flag className="w-3 h-3" />
                      {HOMEWORK_TYPE_LABELS[hw.homework_type as HomeworkType]}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </motion.div>
      )}

      {/* Pack items */}
      {hasPackItems && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-2xl border-2 p-4 shadow-soft transition-colors",
            allPackChecked
              ? "bg-success/10 border-success/30"
              : "bg-card border-border"
          )}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
              allPackChecked ? "bg-success/20" : "bg-accent/20"
            )}>
              {allPackChecked ? (
                <Check className="w-5 h-5 text-success" />
              ) : (
                <Backpack className="w-5 h-5 text-accent" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">Ta med till skolan</h3>
            </div>
            {totalPackItems > 0 && (
              <span className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                allPackChecked
                  ? "bg-success/20 text-success"
                  : "bg-muted text-muted-foreground"
              )}>
                {packCheckedCount}/{totalPackItems}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {items.map(({ homework, items: itemsList }) => (
              <div key={homework.id}>
                <div className="flex items-center gap-2 mb-1">
                  <SubjectBadge subject={homework.subject} size="sm" showLabel={false} />
                  <span className="text-sm font-medium flex-1">{homework.title}</span>
                  {homework.homeworkType && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Flag className="w-3 h-3" />
                      {HOMEWORK_TYPE_LABELS[homework.homeworkType]}
                    </span>
                  )}
                </div>
                <ul className="pl-8 space-y-1">
                  {itemsList.map((item, index) => {
                    const itemId = `hw-${homework.id}-${index}`;
                    const isChecked = checked.has(itemId);
                    return (
                      <li
                        key={index}
                        onClick={() => toggleItem(itemId)}
                        className={cn(
                          "text-sm flex items-center gap-2 py-1.5 px-2 -mx-2 rounded-lg cursor-pointer transition-all active:scale-[0.98]",
                          isChecked
                            ? "text-muted-foreground/50 line-through"
                            : "text-muted-foreground hover:bg-muted/50"
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                          isChecked
                            ? "bg-success border-success"
                            : "border-muted-foreground/30"
                        )}>
                          {isChecked && <Check className="w-3 h-3 text-white" />}
                        </div>
                        {item}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}

            {recurringItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center text-sm">
                    🔄
                  </div>
                  <span className="text-sm font-medium">Återkommande</span>
                </div>
                <ul className="pl-8 space-y-1">
                  {recurringItems.map((item) => {
                    const itemId = `rec-${item.id}`;
                    const isChecked = checked.has(itemId);
                    return (
                      <li
                        key={item.id}
                        onClick={() => toggleItem(itemId)}
                        className={cn(
                          "text-sm flex items-center gap-2 py-1.5 px-2 -mx-2 rounded-lg cursor-pointer transition-all active:scale-[0.98]",
                          isChecked
                            ? "text-muted-foreground/50 line-through"
                            : "text-muted-foreground hover:bg-muted/50"
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                          isChecked
                            ? "bg-success border-success"
                            : "border-muted-foreground/30"
                        )}>
                          {isChecked && <Check className="w-3 h-3 text-white" />}
                        </div>
                        {item.item_name}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
