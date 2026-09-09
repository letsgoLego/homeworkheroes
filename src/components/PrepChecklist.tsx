import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Check, Moon, Backpack } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { PrepItem } from '@/hooks/useFamily';

interface PrepChecklistProps {
  /** Datum listan gäller (imorgon på kvällen, idag på morgonen) */
  date: Date;
  items: PrepItem[];
  variant: 'tomorrow' | 'today';
}

function storageKey(date: Date) {
  return `prep-checked-${format(date, 'yyyy-MM-dd')}`;
}

function readChecked(key: string): Set<string> {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return new Set(JSON.parse(stored) as string[]);
  } catch {}
  return new Set();
}

export function PrepChecklist({ date, items, variant }: PrepChecklistProps) {
  const key = storageKey(date);
  const [checked, setChecked] = useState<Set<string>>(() => readChecked(key));

  useEffect(() => {
    setChecked(readChecked(key));
  }, [key]);

  const toggle = useCallback((id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem(key, JSON.stringify([...next]));
      if (navigator.vibrate) navigator.vibrate(10);
      return next;
    });
  }, [key]);

  if (items.length === 0) return null;

  const doneCount = items.filter(i => checked.has(i.id)).length;
  const allDone = doneCount === items.length;

  const title = variant === 'tomorrow' ? 'Förbered inför imorgon' : 'Ta med till skolan idag';
  const Icon = variant === 'tomorrow' ? Moon : Backpack;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl border-2 p-4 shadow-soft transition-colors',
        allDone ? 'bg-success/10 border-success/30' : 'bg-card border-border'
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
          allDone ? 'bg-success/20' : 'bg-primary/10'
        )}>
          {allDone ? <Check className="w-5 h-5 text-success" /> : <Icon className="w-5 h-5 text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-lg leading-tight">{title}</h2>
          <p className="text-xs text-muted-foreground">
            {format(date, 'EEEE d MMMM', { locale: sv })}
          </p>
        </div>
        <span className={cn(
          'text-xs font-medium px-2 py-1 rounded-full',
          allDone ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
        )}>
          {doneCount}/{items.length}
        </span>
      </div>

      <ul className="space-y-2">
        {items.map((item) => {
          const isChecked = checked.has(item.id);
          const label = item.source === 'activity' ? `Packa ${item.label.toLowerCase()}` : item.label;
          return (
            <li
              key={item.id}
              onClick={() => toggle(item.id)}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all active:scale-[0.98]',
                isChecked ? 'bg-success/5 text-muted-foreground/60' : 'bg-muted/30 hover:bg-muted/50'
              )}
            >
              <div className={cn(
                'w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all',
                isChecked ? 'bg-success border-success' : 'border-muted-foreground/30'
              )}>
                {isChecked && <Check className="w-4 h-4 text-white" />}
              </div>
              <span className="text-lg shrink-0">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={cn('font-medium text-sm truncate', isChecked && 'line-through')}>{label}</p>
                <p className="text-xs text-muted-foreground truncate">{item.context}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </motion.section>
  );
}
