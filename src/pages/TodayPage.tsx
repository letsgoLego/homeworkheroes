import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, parseISO } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useFamily } from '@/hooks/useFamily';
import { TaskCard } from '@/components/TaskCard';
import { BringToSchool } from '@/components/BringToSchool';
import { ChildSwitcher } from '@/components/ChildSwitcher';
import { AddChild } from '@/components/AddChild';
import { Navigation } from '@/components/Navigation';
import { WeatherWidget } from '@/components/WeatherWidget';
import { StreakStats } from '@/components/StreakStats';
import { SubjectBadge } from '@/components/ui/SubjectBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarClock, Sun, Backpack, Bell, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Subject } from '@/types/homework';
import { RecurringPackItems } from '@/components/RecurringPackItems';
import { AddAdhocTask } from '@/components/AddAdhocTask';
import { AdhocTaskCard } from '@/components/AdhocTaskCard';

export default function TodayPage() {
  const navigate = useNavigate();
  const [showAddChild, setShowAddChild] = useState(false);
  const {
    homework,
    children,
    activeChildId,
    setActiveChildId,
    loading,
    userRole,
    getTasksForDate,
    getItemsToBringForDate,
    toggleTask,
    deleteTask,
    snoozeTask,
    unsnoozeTask,
    getRecurringPackItemsForChild,
    addRecurringPackItem,
    deleteRecurringPackItem,
    addAdhocTask,
    adhocTasks,
    toggleAdhocTask,
    deleteAdhocTask,
    getAdhocTasksForDate,
    toggleHomeworkComplete,
  } = useFamily();
  
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const activeChild = children.find((c) => c.id === activeChildId);
  
  // Don't redirect while still loading user role information
  // This prevents premature redirects for child accounts and invited parents
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  
  // Redirect to onboarding only if user has no role (not yet part of any family)
  // Users with a role (parent or child) should NOT be redirected, even if children list is empty
  if (!userRole && children.length === 0) {
    navigate('/onboarding');
    return null;
  }
  
  const tomorrow = addDays(today, 1);
  const currentHour = today.getHours();
  
  // Dynamic: after 12pm show tomorrow's items, before 12pm show today's
  const isAfternoon = currentHour >= 12;
  const bringToSchoolDate = isAfternoon ? tomorrow : today;
  const bringToSchoolLabel = isAfternoon ? 'imorgon' : 'idag';
  
  const todayTasks = activeChildId ? getTasksForDate(activeChildId, today) : [];
  const todayAdhocTasks = activeChildId ? getAdhocTasksForDate(activeChildId, today) : [];
  const itemsToBringData = activeChildId ? getItemsToBringForDate(activeChildId, bringToSchoolDate) : { homeworkItems: [], recurringItems: [] };
  const hasItemsToBring = itemsToBringData.homeworkItems.length > 0 || itemsToBringData.recurringItems.length > 0;
  
  // Get homework due on pack date (today before 12, tomorrow after 12)
  const packDateHomework = homework.filter(hw => {
    if (hw.child_id !== activeChildId) return false;
    const dueDate = format(new Date(hw.due_date), 'yyyy-MM-dd');
    return dueDate === format(bringToSchoolDate, 'yyyy-MM-dd');
  });
  
  // Get homework with reminders for today
  const homeworkWithReminders = homework.filter(hw => {
    if (hw.child_id !== activeChildId) return false;
    if (hw.completed) return false;
    return hw.reminder_date === todayStr && !hw.reminder_sent;
  });
  
  const upcomingHomework = homework
    .filter(hw => hw.child_id === activeChildId && !hw.completed)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 3);
  
  // Filter tasks: 
  // - Active incomplete: not completed AND (not snoozed OR snoozed to today - these "woke up")
  // - Snoozed away: snoozed to a future date (after today)
  // - Completed: completed tasks
  const incompleteTasks = todayTasks
    .filter((t) => !t.task.completed && (!t.task.snoozed_until || t.task.snoozed_until <= todayStr))
    .sort((a, b) => (a.daysOld || 0) - (b.daysOld || 0));
  const snoozedAwayTasks = todayTasks.filter((t) => !t.task.completed && t.task.snoozed_until && t.task.snoozed_until > todayStr);
  const completedTasks = todayTasks.filter((t) => t.task.completed);
  
  // Filter adhoc tasks
  const incompleteAdhocTasks = todayAdhocTasks.filter((t) => !t.completed);
  const completedAdhocTasks = todayAdhocTasks.filter((t) => t.completed);
  
  // Combined counts for display
  const totalIncompleteTasks = incompleteTasks.length + incompleteAdhocTasks.length;
  const hasAnyTasks = todayTasks.length > 0 || todayAdhocTasks.length > 0;
  
  // Helper to check if snoozing is allowed (tomorrow must not be past due date)
  const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
  const canSnoozeTask = (dueDate: string) => tomorrowStr <= dueDate;
  
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
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-celebration" />
              <span className="text-sm text-muted-foreground font-medium">
                {format(today, 'EEEE d MMMM', { locale: sv })}
              </span>
            </div>
          </div>
          <h1 className="text-2xl font-bold">
            {activeChild ? `Hej, ${activeChild.name}! 👋` : 'Välkommen!'}
          </h1>
        </div>
        
        {/* Child switcher - only for parents */}
        {userRole !== 'child' && (
          <div className="px-4 pb-3">
            <ChildSwitcher 
              children={children}
              activeChildId={activeChildId}
              onSelectChild={setActiveChildId}
              onAddChild={() => setShowAddChild(true)} 
            />
          </div>
        )}
      </header>
      
      <main className="px-4 py-4">
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="today" className="flex items-center gap-2">
              <Sun className="w-4 h-4" />
              Idag
            </TabsTrigger>
            <TabsTrigger value="streak" className="flex items-center gap-2">
              <Flame className="w-4 h-4" />
              Streak
            </TabsTrigger>
            <TabsTrigger value="pack" className="flex items-center gap-2">
              <Backpack className="w-4 h-4" />
              Packa
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="today" className="space-y-6">
            {/* Reminders section */}
            {homeworkWithReminders.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-warning/10 border-2 border-warning/30"
              >
                <h3 className="font-bold flex items-center gap-2 text-warning mb-3">
                  <Bell className="w-5 h-5" />
                  Påminnelse - 2 dagar kvar!
                </h3>
                <div className="space-y-2">
                  {homeworkWithReminders.map((hw) => (
                    <div key={hw.id} className="flex items-center gap-3 p-2 rounded-xl bg-background/50">
                      <SubjectBadge subject={hw.subject as Subject} size="sm" showLabel={false} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{hw.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Inlämning {format(new Date(hw.due_date), 'EEEE d MMM', { locale: sv })}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {hw.tasks.filter((t) => t.completed).length}/{hw.tasks.length} klart
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}
            
            {/* Today's tasks */}
            <section>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  📝
                </span>
                Dagens uppgifter
                {totalIncompleteTasks > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({totalIncompleteTasks} kvar)
                  </span>
                )}
              </h2>
              
              <AnimatePresence mode="popLayout">
                {!hasAnyTasks ? (
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
                    <p className="text-lg font-medium">Inga uppgifter idag!</p>
                    <p className="text-muted-foreground">Njut av din lediga tid!</p>
                    
                    {/* Add adhoc task button when empty */}
                    {activeChildId && (
                      <div className="mt-4">
                        <AddAdhocTask 
                          onAdd={(title) => addAdhocTask(activeChildId, title, todayStr)} 
                        />
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {incompleteTasks.map(({ task, homework: hw, wasSnoozed, daysOld }) => (
                      <TaskCard 
                        key={task.id} 
                        task={{
                          id: task.id,
                          homeworkId: task.homework_id,
                          title: task.title,
                          date: task.task_date,
                          completed: task.completed,
                          completedAt: task.completed_at || undefined,
                          snoozedUntil: task.snoozed_until || undefined,
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
                        onDelete={deleteTask}
                        onSnooze={snoozeTask}
                        onUnsnooze={unsnoozeTask}
                        wasSnoozed={wasSnoozed}
                        canSnooze={canSnoozeTask(hw.due_date)}
                        daysOld={daysOld}
                      />
                    ))}
                    
                    {/* Adhoc tasks (incomplete) */}
                    {incompleteAdhocTasks.map((task) => (
                      <AdhocTaskCard
                        key={task.id}
                        task={task}
                        onToggle={toggleAdhocTask}
                        onDelete={deleteAdhocTask}
                      />
                    ))}
                    
                    {/* Add adhoc task button */}
                    {activeChildId && (
                      <AddAdhocTask 
                        onAdd={(title) => addAdhocTask(activeChildId, title, todayStr)} 
                      />
                    )}
                    
                    {/* Completed and Snoozed Away section */}
                    {(completedTasks.length > 0 || snoozedAwayTasks.length > 0 || completedAdhocTasks.length > 0) && (
                      <>
                        <div className="flex items-center gap-2 pt-4">
                          <div className="h-px flex-1 bg-border" />
                          <span className="text-xs text-muted-foreground font-medium">
                            Klart & Snoozat ({completedTasks.length + snoozedAwayTasks.length + completedAdhocTasks.length})
                          </span>
                          <div className="h-px flex-1 bg-border" />
                        </div>
                        
                        {/* Tasks snoozed away from today */}
                        {snoozedAwayTasks.map(({ task, homework: hw }) => (
                          <TaskCard 
                            key={task.id} 
                            task={{
                              id: task.id,
                              homeworkId: task.homework_id,
                              title: task.title,
                              date: task.task_date,
                              completed: task.completed,
                              completedAt: task.completed_at || undefined,
                              snoozedUntil: task.snoozed_until || undefined,
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
                            onDelete={deleteTask}
                            onSnooze={snoozeTask}
                            onUnsnooze={unsnoozeTask}
                            isSnoozed
                            canSnooze={canSnoozeTask(hw.due_date)}
                          />
                        ))}
                        
                        {/* Completed tasks */}
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
                              snoozedUntil: task.snoozed_until || undefined,
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
                            onDelete={deleteTask}
                            onSnooze={snoozeTask}
                            onUnsnooze={unsnoozeTask}
                          />
                        ))}
                        
                        {/* Completed adhoc tasks */}
                        {completedAdhocTasks.map((task) => (
                          <AdhocTaskCard
                            key={task.id}
                            task={task}
                            onToggle={toggleAdhocTask}
                            onDelete={deleteAdhocTask}
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
                  Kommande
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
                          Inlämning {format(new Date(hw.due_date), 'EEE d MMM', { locale: sv })}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {hw.tasks.filter((t) => t.completed).length}/{hw.tasks.length} klart
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </TabsContent>
          
          <TabsContent value="streak" className="space-y-6">
            <div className="mb-2">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-primary" />
                </span>
                Min progress
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Så här går det för dig!
              </p>
            </div>
            
            {activeChildId && (
              <StreakStats homework={homework} childId={activeChildId} adhocTasks={adhocTasks} />
            )}
            
            {!activeChildId && (
              <div className="text-center py-12 text-muted-foreground">
                <p>Välj ett barn för att se streaks</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="pack" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-muted-foreground">
                Ta med {bringToSchoolLabel} ({format(bringToSchoolDate, 'EEEE d MMMM', { locale: sv })})
              </span>
            </div>
            
            {/* Weather for packing day */}
            <WeatherWidget date={bringToSchoolDate} />
            
            {/* Unified pack & homework checklist */}
            <BringToSchool 
              packDate={bringToSchoolDate}
              items={itemsToBringData.homeworkItems.map(item => ({
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
                  homeworkType: (item.homework.homework_type as 'inlamning' | 'forhor') || 'inlamning',
                },
                items: item.items as string[],
              }))} 
              recurringItems={itemsToBringData.recurringItems}
              homeworkDue={packDateHomework.map(hw => ({
                id: hw.id,
                title: hw.title,
                subject: hw.subject,
                homework_type: hw.homework_type,
                completed: hw.completed,
                tasks: hw.tasks.map(t => ({ id: t.id, completed: t.completed })),
                bring_to_school: hw.bring_to_school,
              }))}
              onToggleHomeworkComplete={toggleHomeworkComplete}
            />
            
            {!hasItemsToBring && packDateHomework.length === 0 && (
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
                <p className="text-lg font-medium">Inget att packa!</p>
                <p className="text-muted-foreground">Inga läxor eller saker att ta med</p>
              </motion.div>
            )}
            
            {/* Recurring pack items management */}
            {activeChildId && (
              <div className="mt-6 pt-6 border-t border-border">
                <RecurringPackItems
                  items={getRecurringPackItemsForChild(activeChildId).map(item => ({
                    id: item.id,
                    itemName: item.item_name,
                    weekdays: item.weekdays,
                  }))}
                  onAdd={(itemName, weekdays) => addRecurringPackItem(activeChildId, itemName, weekdays)}
                  onDelete={deleteRecurringPackItem}
                />
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
