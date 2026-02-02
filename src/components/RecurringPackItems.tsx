import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const WEEKDAYS = [
  { value: 1, label: 'Mån', fullLabel: 'Måndag' },
  { value: 2, label: 'Tis', fullLabel: 'Tisdag' },
  { value: 3, label: 'Ons', fullLabel: 'Onsdag' },
  { value: 4, label: 'Tor', fullLabel: 'Torsdag' },
  { value: 5, label: 'Fre', fullLabel: 'Fredag' },
  { value: 6, label: 'Lör', fullLabel: 'Lördag' },
  { value: 0, label: 'Sön', fullLabel: 'Söndag' },
];

interface RecurringPackItem {
  id: string;
  itemName: string;
  weekdays: number[];
}

interface RecurringPackItemsProps {
  items: RecurringPackItem[];
  onAdd: (itemName: string, weekdays: number[]) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export function RecurringPackItems({ items, onAdd, onDelete }: RecurringPackItemsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort((a, b) => a - b)
    );
  };

  const handleAdd = async () => {
    if (!newItemName.trim() || selectedDays.length === 0) return;
    
    setLoading(true);
    const success = await onAdd(newItemName.trim(), selectedDays);
    setLoading(false);
    
    if (success) {
      setNewItemName('');
      setSelectedDays([]);
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    await onDelete(id);
    setLoading(false);
  };

  const getDaysLabel = (weekdays: number[]) => {
    return weekdays
      .map(d => WEEKDAYS.find(w => w.value === d)?.label)
      .filter(Boolean)
      .join(', ');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Återkommande packlistor</h3>
        {!isAdding && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="h-8"
          >
            <Plus className="w-4 h-4 mr-1" />
            Lägg till
          </Button>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {/* Add form */}
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 rounded-xl bg-muted/50 space-y-3"
          >
            <div className="flex gap-2">
              <Input
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="t.ex. Gympapåse, Simkläder"
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsAdding(false);
                  setNewItemName('');
                  setSelectedDays([]);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">Vilka dagar?</p>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => (
                  <button
                    key={day.value}
                    onClick={() => toggleDay(day.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                      selectedDays.includes(day.value)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleAdd}
              disabled={loading || !newItemName.trim() || selectedDays.length === 0}
              className="w-full"
              size="sm"
            >
              {loading ? 'Sparar...' : 'Lägg till'}
            </Button>
          </motion.div>
        )}

        {/* Existing items */}
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-card shadow-soft"
          >
            <div className="w-8 h-8 rounded-lg bg-accent/30 flex items-center justify-center">
              🎒
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{item.itemName}</p>
              <p className="text-xs text-muted-foreground">
                Varje {getDaysLabel(item.weekdays)}
              </p>
            </div>
            <button
              onClick={() => handleDelete(item.id)}
              className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
              disabled={loading}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </motion.div>
        ))}

        {items.length === 0 && !isAdding && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground text-center py-4"
          >
            Inga återkommande saker att packa ännu
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
