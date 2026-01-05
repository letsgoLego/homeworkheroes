import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays } from 'date-fns';
import { useFamily } from '@/hooks/useFamily';
import { TaskCard } from '@/components/TaskCard';
import { BringToSchool } from '@/components/BringToSchool';
import { ChildSwitcher } from '@/components/ChildSwitcher';
import { AddChild } from '@/components/AddChild';
import { Navigation } from '@/components/Navigation';
import { SubjectBadge } from '@/components/ui/SubjectBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarClock, Sun, Backpack } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Subject } from '@/types/homework';

export default function TodayPage() {
  const navigate = useNavigate();
  const [showAddChild, setShowAddChild] = useState(false);
  const {
    homework,
    children,
    activeChildId,
    setActiveChildId,
    loading,
    getTasksForDate,
    getItemsToBringForDate,
    toggleTask,
  } = useFamily();
  
  const today = new Date();
  const activeChild = children.find((c) => c.id === activeChildId);
  
  // Redirect to onboarding if no family
  if (!loading && children.length === 0) {
    navigate('/onboarding');
    return null;
  }
  
  const tomorrow = addDays(today, 1);
  
  const todayTasks = activeChildId ? getTasksForDate(activeChildId, today) : [];
  const itemsToBring = activeChildId ? getItemsToBringForDate(activeChildId, today) : [];
  
  // Get homework due tomorrow for "Pack for Tomorrow" tab
  const tomorrowHomework = homework.filter(hw => {
    if (hw.child_id !== activeChildId) return false;
    const dueDate = new Date(hw.due_date);
    return format(dueDate, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd');
  });
  
  const upcomingHomework = homework
    .filter(hw => hw.child_id === activeChildId && !hw.completed)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 3);
  
  const incompleteTasks = todayTasks.filter((t) => !t.task.completed);
  const completedTasks = todayTasks.filter((t) => t.task.completed);
  
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
          <ChildSwitcher 
            children={children}
            activeChildId={activeChildId}
            onSelectChild={setActiveChildId}
            onAddChild={() => setShowAddChild(true)} 
          />
        </div>
      </header>
      
      <main className="px-4 py-4">
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="today" className="flex items-center gap-2">
              <Sun className="w-4 h-4" />
              Today
            </TabsTrigger>
            <TabsTrigger value="pack" className="flex items-center gap-2">
              <Backpack className="w-4 h-4" />
              Pack Tomorrow
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="today" className="space-y-6">
            {/* Items to bring */}
            <BringToSchool items={itemsToBring.map(item => ({
              homework: {
                ...item.homework,
                id: item.homework.id,
                title: item.homework.title,
                subject: item.homework.subject as Subject,
                dueDate: item.homework.due_date,
                childId: item.homework.child_id,
                createdAt: item.homework.created_at,
                tasks: [],
                completed: item.homework.completed,
              },
              items: item.items as string[],
            }))} />
            
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
                      <TaskCard 
                        key={task.id} 
                        task={{
                          id: task.id,
                          homeworkId: task.homework_id,
                          title: task.title,
                          date: task.task_date,
                          completed: task.completed,
                          completedAt: task.completed_at || undefined,
                        }}
                        homework={{
                          id: hw.id,
                          title: hw.title,
                          subject: hw.subject as Subject,
                          dueDate: hw.due_date,
                          childId: hw.child_id,
                          createdAt: hw.created_at,
                          tasks: hw.tasks.map(t => ({
                            id: t.id,
                            homeworkId: t.homework_id,
                            title: t.title,
                            date: t.task_date,
                            completed: t.completed,
                          })),
                          completed: hw.completed,
                        }}
                        onToggle={toggleTask}
                      />
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
                          <TaskCard 
                            key={task.id} 
                            task={{
                              id: task.id,
                              homeworkId: task.homework_id,
                              title: task.title,
                              date: task.task_date,
                              completed: task.completed,
                              completedAt: task.completed_at || undefined,
                            }}
                            homework={{
                              id: hw.id,
                              title: hw.title,
                              subject: hw.subject as Subject,
                              dueDate: hw.due_date,
                              childId: hw.child_id,
                              createdAt: hw.created_at,
                              tasks: hw.tasks.map(t => ({
                                id: t.id,
                                homeworkId: t.homework_id,
                                title: t.title,
                                date: t.task_date,
                                completed: t.completed,
                              })),
                              completed: hw.completed,
                            }}
                            onToggle={toggleTask}
                          />
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
                      <SubjectBadge subject={hw.subject as Subject} size="sm" showLabel={false} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{hw.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Due {format(new Date(hw.due_date), 'EEE, MMM d')}
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
          </TabsContent>
          
          <TabsContent value="pack" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-muted-foreground">
                {format(tomorrow, 'EEEE, MMMM d')}
              </span>
            </div>
            
            {tomorrowHomework.length === 0 ? (
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
                  🎒
                </motion.div>
                <p className="text-lg font-medium">Nothing due tomorrow!</p>
                <p className="text-muted-foreground">No homework to pack</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {tomorrowHomework.map((hw) => (
                  <motion.div
                    key={hw.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl bg-card border-2 border-border p-4 shadow-soft"
                  >
                    <div className="flex items-start gap-3">
                      <SubjectBadge subject={hw.subject as Subject} size="md" showLabel={false} />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base">{hw.title}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{hw.subject}</p>
                        
                        {hw.bring_to_school && hw.bring_to_school.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Items to bring:</p>
                            <ul className="space-y-1">
                              {hw.bring_to_school.map((item, index) => (
                                <li key={index} className="text-sm flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {hw.tasks.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs text-muted-foreground">
                              {hw.tasks.filter(t => t.completed).length}/{hw.tasks.length} tasks done
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {hw.completed ? (
                        <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-full font-medium">
                          Done
                        </span>
                      ) : (
                        <span className="text-xs bg-warning/20 text-warning px-2 py-1 rounded-full font-medium">
                          Pending
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      <Navigation />
      <AddChild open={showAddChild} onClose={() => setShowAddChild(false)} />
    </div>
  );
}
