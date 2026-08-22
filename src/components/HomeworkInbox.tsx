import { useState } from 'react';
import { motion } from 'framer-motion';
import { differenceInCalendarDays, format, parseISO, startOfDay } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Inbox, ArrowRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SUBJECT_ICONS, SUBJECT_LABELS, Subject } from '@/types/homework';
import { PlanHomeworkSheet } from '@/components/PlanHomeworkSheet';
import type { InboxHomework } from '@/hooks/queries/useHomeworkData';

interface HomeworkInboxProps {
  items: InboxHomework[];
  /** Parents only see the status, children plan the homework */
  readOnly?: boolean;
  childNameById?: Record<string, string>;
}

export function HomeworkInbox({ items, readOnly, childNameById }: HomeworkInboxProps) {
  const [planning, setPlanning] = useState<InboxHomework | null>(null);

  if (items.length === 0) return null;

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-2xl bg-warning/10 border-2 border-warning/30"
      >
        <div className="flex items-center gap-2 mb-3">
          <Inbox className="w-5 h-5 text-warning" />
          <h2 className="font-bold">
            Inkorg ({items.length})
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          {readOnly
            ? 'Väntar på att barnet planerar dagarna.'
            : 'Nya läxor från din förälder – välj vilka dagar du gör dem.'}
        </p>

        <div className="space-y-2">
          {items.map(hw => {
            const daysLeft = differenceInCalendarDays(startOfDay(parseISO(hw.due_date)), startOfDay(new Date()));
            return (
              <div key={hw.id} className="p-3 rounded-xl bg-card border border-border">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">
                      {SUBJECT_ICONS[hw.subject as Subject]} {hw.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {SUBJECT_LABELS[hw.subject as Subject]}
                      {childNameById?.[hw.child_id] ? ` · ${childNameById[hw.child_id]}` : ''}
                      {' · '}
                      {format(parseISO(hw.due_date), 'd MMM', { locale: sv })}
                      {hw.planItems.length > 0 ? ` · ${hw.planItems.length} delar` : ''}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg',
                      daysLeft <= 1 ? 'bg-destructive/15 text-destructive' : 'bg-warning/15 text-warning'
                    )}
                  >
                    <Clock className="w-3 h-3" />
                    {daysLeft <= 0 ? 'Idag' : `${daysLeft} d`}
                  </span>
                </div>

                {readOnly ? (
                  <p className="mt-2 text-xs font-medium text-warning">Väntar på planering</p>
                ) : (
                  <Button size="sm" className="mt-3 w-full" onClick={() => setPlanning(hw)}>
                    Planera dagar
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </motion.section>

      {!readOnly && <PlanHomeworkSheet homework={planning} onClose={() => setPlanning(null)} />}
    </>
  );
}
