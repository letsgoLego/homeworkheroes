import { useState } from 'react';
import { motion } from 'framer-motion';
import { Navigation } from '@/components/Navigation';
import { AddHomework } from '@/components/AddHomework';
import { ChildSwitcher } from '@/components/ChildSwitcher';
import { AddChild } from '@/components/AddChild';
import { useHomeworkStore } from '@/stores/homeworkStore';
import { SubjectBadge } from '@/components/ui/SubjectBadge';
import { Plus, Calendar, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';

export default function AddPage() {
  const [showAddHomework, setShowAddHomework] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);
  const { homework, activeChildId, deleteHomework } = useHomeworkStore();
  
  const childHomework = homework.filter((hw) => hw.childId === activeChildId);
  const activeHomework = childHomework.filter((hw) => !hw.completed);
  const completedHomework = childHomework.filter((hw) => hw.completed);
  
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-lg z-40 safe-area-top border-b border-border">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold mb-4">Homework 📚</h1>
        </div>
        
        {/* Child switcher */}
        <div className="px-4 pb-3">
          <ChildSwitcher onAddChild={() => setShowAddChild(true)} />
        </div>
      </header>
      
      <main className="px-4 py-4 space-y-6">
        {/* Add homework button */}
        <Button
          onClick={() => setShowAddHomework(true)}
          className="w-full h-14 text-lg shadow-glow-primary"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Homework
        </Button>
        
        {/* Active homework */}
        <section>
          <h2 className="text-lg font-bold mb-3">Active ({activeHomework.length})</h2>
          
          {activeHomework.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-muted-foreground"
            >
              <p>No active homework! 🎉</p>
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
                    <SubjectBadge subject={hw.subject} size="sm" />
                    <button
                      onClick={() => deleteHomework(hw.id)}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <h3 className="font-bold text-lg mb-1">{hw.title}</h3>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>Due {format(parseISO(hw.dueDate), 'EEE, MMM d')}</span>
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
                        {hw.tasks.filter((t) => t.completed).length}/{hw.tasks.length} tasks
                      </span>
                    </div>
                    
                    {hw.bringToSchool && hw.bringToSchool.length > 0 && (
                      <span className="text-xs text-accent">
                        🎒 {hw.bringToSchool.length} items
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
              Completed ({completedHomework.length})
            </h2>
            
            <div className="space-y-2">
              {completedHomework.map((hw) => (
                <motion.div
                  key={hw.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 rounded-xl bg-success/10 flex items-center gap-3"
                >
                  <SubjectBadge subject={hw.subject} size="sm" showLabel={false} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{hw.title}</p>
                    {hw.needsMorePractice && (
                      <p className="text-xs text-accent">📖 Practice scheduled</p>
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
    </div>
  );
}
