import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useHomeworkStore } from '@/stores/homeworkStore';
import { Plus } from 'lucide-react';

interface ChildSwitcherProps {
  onAddChild: () => void;
}

export function ChildSwitcher({ onAddChild }: ChildSwitcherProps) {
  const { children, activeChildId, setActiveChild } = useHomeworkStore();
  
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4">
      {children.map((child) => (
        <motion.button
          key={child.id}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveChild(child.id)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all',
            activeChildId === child.id
              ? 'shadow-card'
              : 'bg-muted hover:bg-muted/80'
          )}
          style={{
            backgroundColor: activeChildId === child.id ? child.color : undefined,
            color: activeChildId === child.id ? 'white' : undefined,
          }}
        >
          <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
            {child.name[0]}
          </span>
          <span className="font-medium">{child.name}</span>
        </motion.button>
      ))}
      
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onAddChild}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted hover:bg-muted/80 whitespace-nowrap"
      >
        <Plus className="w-4 h-4" />
        <span className="font-medium">Add Child</span>
      </motion.button>
    </div>
  );
}
