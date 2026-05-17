import { useState } from 'react';

import { motion } from 'framer-motion';
import { Navigation } from '@/components/Navigation';
import { AddHomework } from '@/components/AddHomework';
import { EditHomework } from '@/components/EditHomework';
import { AddActivity } from '@/components/AddActivity';
import { AddTodo } from '@/components/AddTodo';
import { ActivityCard } from '@/components/ActivityCard';
import { ChildSwitcher } from '@/components/ChildSwitcher';
import { AddChild } from '@/components/AddChild';
import { useFamily } from '@/hooks/useFamily';
import { SubjectBadge } from '@/components/ui/SubjectBadge';
import { Plus, Calendar, Trash2, Pencil, Repeat, Flag, AlertTriangle, ListTodo } from 'lucide-react';
import { HOMEWORK_TYPE_LABELS, HomeworkType } from '@/types/homework';
import { Button } from '@/components/ui/button';
import { format, isPast, parseISO, startOfDay } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Subject } from '@/types/homework';
import type { Tables } from '@/integrations/supabase/types';

type Homework = Tables<'homework'>;
type StudyTask = Tables<'study_tasks'>;

interface HomeworkWithTasks extends Homework {
  tasks: StudyTask[];
}

export default function AddPage() {
  const [showAddHomework, setShowAddHomework] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);
  const [editingHomework, setEditingHomework] = useState<HomeworkWithTasks | null>(null);
  const { homework, children, activeChildId, setActiveChildId, deleteHomework, loading, activities, addActivity, deleteActivity } = useFamily();
  
  const today = startOfDay(new Date());
  const childHomework = homework.filter((hw) => hw.child_id === activeChildId);
  
  // Split into: overdue (past due, not completed), active (not past due, not completed), completed
  const overdueHomework = childHomework.filter((hw) => !hw.completed && isPast(parseISO(hw.due_date)) && parseISO(hw.due_date) < today);
  const activeHomework = childHomework.filter((hw) => !hw.completed && parseISO(hw.due_date) >= today);
  const completedHomework = childHomework.filter((hw) => hw.completed);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-lg z-40 safe-area-top border-b border-border">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold mb-4">Läxor 📚</h1>
        </div>
        
        {/* Child switcher */}
        <div className="px-4 pb-3">
          <ChildSwitcher 
            children={children}
            activeChildId={activeChildId}
            onSelectChild={setActiveChildId}
            onAddChild={() => setShowAddChild(true)} 
          />
        </div>
      </header>
      
      <main className="px-4 py-4 space-y-6">
        {/* Add buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => setShowAddHomework(true)}
            className="h-14 text-base shadow-glow-primary"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Ny läxa 📚
          </Button>
          <Button
            onClick={() => setShowAddActivity(true)}
            variant="secondary"
            className="h-14 text-base"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Ny aktivitet 🏃
          </Button>
        </div>
        
        {/* Overdue homework */}
        {overdueHomework.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-3 text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Försenade ({overdueHomework.length})
            </h2>
            
            <div className="space-y-3">
              {overdueHomework.map((hw) => (
                <motion.div
                  key={hw.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 shadow-card"
                >
                  <div className="flex items-start justify-between mb-2">
                    <SubjectBadge subject={hw.subject as Subject} size="sm" />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingHomework(hw)}
                        className="p-1 text-muted-foreground hover:text-primary transition-colors"
                        title="Redigera uppgifter"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteHomework(hw.id)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-lg mb-1 flex items-center gap-2 flex-wrap">
                    {hw.title}
                    {hw.homework_type && hw.homework_type !== 'inlamning' && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Flag className="w-3 h-3" />
                        {HOMEWORK_TYPE_LABELS[hw.homework_type as HomeworkType]}
                      </span>
                    )}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-sm text-destructive mb-3">
                    <Flag className="w-4 h-4" />
                    <span>
                      Försenad: {format(new Date(hw.due_date), 'EEE d MMM', { locale: sv })}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-destructive transition-all"
                          style={{
                            width: hw.tasks.length > 0
                              ? `${(hw.tasks.filter((t) => t.completed).length / hw.tasks.length) * 100}%`
                              : '0%',
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {hw.tasks.filter((t) => t.completed).length}/{hw.tasks.length} uppgifter
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}
        
        {/* Active homework */}
        <section>
          <h2 className="text-lg font-bold mb-3">Aktiva ({activeHomework.length})</h2>
          
          {activeHomework.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-muted-foreground"
            >
              <p>Inga aktiva läxor! 🎉</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {activeHomework.map((hw) => (
                <motion.div
                  key={hw.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-card shadow-card"
                >
                  <div className="flex items-start justify-between mb-2">
                    <SubjectBadge subject={hw.subject as Subject} size="sm" />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingHomework(hw)}
                        className="p-1 text-muted-foreground hover:text-primary transition-colors"
                        title="Redigera uppgifter"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteHomework(hw.id)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-lg mb-1 flex items-center gap-2 flex-wrap">
                    {hw.title}
                    {hw.homework_type && hw.homework_type !== 'inlamning' && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Flag className="w-3 h-3" />
                        {HOMEWORK_TYPE_LABELS[hw.homework_type as HomeworkType]}
                      </span>
                    )}
                    {hw.is_recurring && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Repeat className="w-3 h-3" />
                        Återkommande
                      </span>
                    )}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Flag className="w-4 h-4" />
                    <span>
                      {hw.is_recurring 
                        ? `Pågår t.o.m. ${format(new Date(hw.due_date), 'd MMM', { locale: sv })}`
                        : `${HOMEWORK_TYPE_LABELS[(hw.homework_type as HomeworkType) || 'inlamning']} ${format(new Date(hw.due_date), 'EEE d MMM', { locale: sv })}`
                      }
                    </span>
                  </div>
                  
                  {hw.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {hw.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-success transition-all"
                          style={{
                            width: hw.tasks.length > 0
                              ? `${(hw.tasks.filter((t) => t.completed).length / hw.tasks.length) * 100}%`
                              : '0%',
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {hw.tasks.filter((t) => t.completed).length}/{hw.tasks.length} uppgifter
                      </span>
                    </div>
                    
                    {hw.bring_to_school && hw.bring_to_school.length > 0 && (
                      <span className="text-xs text-accent">
                        🎒 {hw.bring_to_school.length} saker
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
        
        {/* Completed homework */}
        {completedHomework.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-3 text-muted-foreground">
              Klara ({completedHomework.length})
            </h2>
            
            <div className="space-y-2">
              {completedHomework.map((hw) => (
                <motion.div
                  key={hw.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 rounded-xl bg-success/10 flex items-center gap-3"
                >
                  <SubjectBadge subject={hw.subject as Subject} size="sm" showLabel={false} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{hw.title}</p>
                    {hw.needs_more_practice && (
                      <p className="text-xs text-accent">📖 Övning schemalagd</p>
                    )}
                  </div>
                  <span className="text-success text-lg">✓</span>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </main>

      
      
      <Navigation />
      <AddHomework open={showAddHomework} onClose={() => setShowAddHomework(false)} />
      <AddChild open={showAddChild} onClose={() => setShowAddChild(false)} />
      {activeChildId && (
        <AddActivity
          open={showAddActivity}
          onClose={() => setShowAddActivity(false)}
          onAdd={(data) => addActivity(activeChildId, data)}
        />
      )}
      {editingHomework && (
        <EditHomework 
          open={true} 
          onClose={() => setEditingHomework(null)} 
          homework={editingHomework}
        />
      )}
    </div>
  );
}
