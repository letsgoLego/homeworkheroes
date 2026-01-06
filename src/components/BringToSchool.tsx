import { motion } from 'framer-motion';
import { Backpack } from 'lucide-react';
import { SubjectBadge } from './ui/SubjectBadge';
import { Homework } from '@/types/homework';

interface BringToSchoolProps {
  items: { homework: Homework; items: string[] }[];
}

export function BringToSchool({ items }: BringToSchoolProps) {
  if (items.length === 0) return null;
  
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
        {items.map(({ homework, items }) => (
          <div key={homework.id}>
            <div className="flex items-center gap-2 mb-1">
              <SubjectBadge subject={homework.subject} size="sm" showLabel={false} />
              <span className="text-sm font-medium">{homework.title}</span>
            </div>
            <ul className="pl-8 space-y-1">
              {items.map((item, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
