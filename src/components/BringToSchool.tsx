import { motion } from 'framer-motion';
import { Backpack, Flag } from 'lucide-react';
import { SubjectBadge } from './ui/SubjectBadge';
import { Homework, HOMEWORK_TYPE_LABELS } from '@/types/homework';

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
}

export function BringToSchool({ items, recurringItems = [] }: BringToSchoolProps) {
  if (items.length === 0 && recurringItems.length === 0) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-accent/50 border-2 border-accent p-4 shadow-soft"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
          <Backpack className="w-5 h-5 text-accent-foreground" />
        </div>
        <h3 className="font-bold text-lg">Ta med till skolan</h3>
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
              {itemsList.map((item, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  {item}
                </li>
              ))}
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
              {recurringItems.map((item) => (
                <li key={item.id} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  {item.item_name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
}
