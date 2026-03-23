import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Backpack, Flag, Check } from 'lucide-react';
import { SubjectBadge } from './ui/SubjectBadge';
import { Homework, HOMEWORK_TYPE_LABELS } from '@/types/homework';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface RecurringPackItem {
  id: string;
  child_id: string;
  item_name: string;
  weekdays: number[];
  created_at: string;
}

interface BringToSchoolProps {
  items: { homework: Homework; items: string[] }[];
  recurringItems?: RecurringPackItem[];
  packDate?: Date;
}

/**
 * Returns a localStorage key that resets at 14:00 each day.
 * Before 14:00 → today's date key. After 14:00 → tomorrow's date key.
 * This way items checked the evening before persist until 14:00 next day.
 */
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

export function BringToSchool({ items, recurringItems = [], packDate }: BringToSchoolProps) {
  const sessionKey = getPackSessionKey(packDate);
  const [checked, setChecked] = useState<Set<string>>(() => getCheckedItems(sessionKey));

  // Sync when session key changes (date change)
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
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(10);
      return next;
    });
  }, [sessionKey]);

  if (items.length === 0 && recurringItems.length === 0) return null;

  // Count totals
  const totalItems = items.reduce((sum, { items: il }) => sum + il.length, 0) + recurringItems.length;
  const checkedCount = checked.size;
  const allChecked = checkedCount >= totalItems && totalItems > 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border-2 p-4 shadow-soft transition-colors",
        allChecked
          ? "bg-green-500/10 border-green-500/30"
          : "bg-accent/50 border-accent"
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
          allChecked ? "bg-green-500/20" : "bg-accent"
        )}>
          {allChecked ? (
            <Check className="w-5 h-5 text-green-600" />
          ) : (
            <Backpack className="w-5 h-5 text-accent-foreground" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg">Ta med till skolan</h3>
        </div>
        {totalItems > 0 && (
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-full",
            allChecked
              ? "bg-green-500/20 text-green-700"
              : "bg-muted text-muted-foreground"
          )}>
            {checkedCount}/{totalItems}
          </span>
        )}
      </div>
      
      <div className="space-y-3">
        {/* Homework items with type indicator */}
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
                      "text-sm flex items-center gap-2 py-1 px-2 -mx-2 rounded-lg cursor-pointer transition-all active:scale-[0.98]",
                      isChecked
                        ? "text-muted-foreground/50 line-through"
                        : "text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                      isChecked
                        ? "bg-green-500 border-green-500"
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
        
        {/* Recurring pack items */}
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
                      "text-sm flex items-center gap-2 py-1 px-2 -mx-2 rounded-lg cursor-pointer transition-all active:scale-[0.98]",
                      isChecked
                        ? "text-muted-foreground/50 line-through"
                        : "text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                      isChecked
                        ? "bg-green-500 border-green-500"
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
  );
}
