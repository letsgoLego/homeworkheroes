import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useHomeworkStore } from '@/stores/homeworkStore';
import { TaskCard } from '@/components/TaskCard';
import { BringToSchool } from '@/components/BringToSchool';
import { ChildSwitcher } from '@/components/ChildSwitcher';
import { AddChild } from '@/components/AddChild';
import { Navigation } from '@/components/Navigation';
import { SubjectBadge } from '@/components/ui/SubjectBadge';
import { CalendarClock, Sun } from 'lucide-react';

export default function TodayPage() {
  const [showAddChild, setShowAddChild] = useState(false);
  const {
    homework,
    activeChildId,
    children,
    getTasksForDate,
    getItemsToBringForDate,
    getUpcomingDueDates,
  } = useHomeworkStore();
  
  const today = new Date();
  const activeChild = children.find((c) => c.id === activeChildId);
  
  const todayTasks = activeChildId
    ? homework
        .filter((hw) => hw.childId === activeChildId)
        .flatMap((hw) =>
          hw.tasks
            .filter((t) => t.date === format(today, 'yyyy-MM-dd'))
            .map((task) => ({ task, homework: hw }))
        )
    : [];
  
  const itemsToBring = activeChildId
    ? getItemsToBringForDate(activeChildId, today)
    : [];
  
  const upcomingHomework = activeChildId
    ? getUpcomingDueDates(activeChildId).slice(0, 3)
    : [];
  
  const incompleteTasks = todayTasks.filter((t) => !t.task.completed);
  const completedTasks = todayTasks.filter((t) => t.task.completed);
  
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-lg z-40 safe-area-top border-b border-border">
        <div className="px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Sun className="w-5 h-5 text-celebration" />
            <span className="text-sm text-muted-foreground font-medium">
              {format(today, 'EEEE, MMMM d')}
            </span>
          </div>
          <h1 className="text-2xl font-bold">
            {activeChild ? `Hi, ${activeChild.name}! 👋` : 'Welcome!'}
          </h1>
        </div>
        
        {/* Child switcher */}
        <div className="px-4 pb-3">
          <ChildSwitcher onAddChild={() => setShowAddChild(true)} />
        </div>
      </header>
      
      <main className="px-4 py-4 space-y-6">
        {/* Items to bring */}
        <BringToSchool items={itemsToBring} />
        
        {/* Today's tasks */}
        <section>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              📝
            </span>
            Today's Tasks
            {incompleteTasks.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({incompleteTasks.length} left)
              </span>
            )}
          </h2>
          
          <AnimatePresence mode="popLayout">
            {todayTasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-5xl mb-4"
                >
                  🎉
                </motion.div>
                <p className="text-lg font-medium">No tasks for today!</p>
                <p className="text-muted-foreground">Enjoy your free time!</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {incompleteTasks.map(({ task, homework: hw }) => (
                  <TaskCard key={task.id} task={task} homework={hw} />
                ))}
                
                {completedTasks.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 pt-4">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-xs text-muted-foreground font-medium">
                        Completed ({completedTasks.length})
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    {completedTasks.map(({ task, homework: hw }) => (
                      <TaskCard key={task.id} task={task} homework={hw} />
                    ))}
                  </>
                )}
              </div>
            )}
          </AnimatePresence>
        </section>
        
        {/* Upcoming due dates */}
        {upcomingHomework.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-accent/30 flex items-center justify-center">
                <CalendarClock className="w-4 h-4 text-accent" />
              </span>
              Coming Up
            </h2>
            
            <div className="space-y-2">
              {upcomingHomework.map((hw) => (
                <motion.div
                  key={hw.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card shadow-soft"
                >
                  <SubjectBadge subject={hw.subject} size="sm" showLabel={false} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{hw.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Due {format(new Date(hw.dueDate), 'EEE, MMM d')}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {hw.tasks.filter((t) => t.completed).length}/{hw.tasks.length} done
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </main>
      
      <Navigation />
      <AddChild open={showAddChild} onClose={() => setShowAddChild(false)} />
    </div>
  );
}
