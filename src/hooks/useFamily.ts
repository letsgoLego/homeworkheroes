import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, addDays, getDay } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type Child = Tables<'children'>;
type Homework = Tables<'homework'>;
type StudyTask = Tables<'study_tasks'>;
type Family = Tables<'families'>;
type RecurringPackItem = Tables<'recurring_pack_items'>;
type AdhocTask = Tables<'adhoc_tasks'>;

interface HomeworkWithTasks extends Homework {
  tasks: StudyTask[];
}

const ACTIVE_CHILD_KEY = 'laxhjalpen_active_child';

export function useFamily() {
  const { user } = useAuth();
  const [family, setFamily] = useState<Family | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [homework, setHomework] = useState<HomeworkWithTasks[]>([]);
  const [recurringPackItems, setRecurringPackItems] = useState<RecurringPackItem[]>([]);
  const [adhocTasks, setAdhocTasks] = useState<AdhocTask[]>([]);
  const [userRole, setUserRole] = useState<'parent' | 'child' | null>(null);
  const [activeChildId, setActiveChildIdState] = useState<string | null>(() => {
    // Initialize from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ACTIVE_CHILD_KEY);
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  // Wrapper to persist to localStorage
  const setActiveChildId = useCallback((id: string | null) => {
    setActiveChildIdState(id);
    if (id) {
      localStorage.setItem(ACTIVE_CHILD_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_CHILD_KEY);
    }
  }, []);
  
  // Fetch family and children
  const fetchFamilyData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      // Get user's role - could be parent (with family_id) or child (with child_id)
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('family_id, child_id, role')
        .eq('user_id', user.id)
        .limit(1);
      
      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        setLoading(false);
        return;
      }
      
      if (!roles || roles.length === 0) {
        setLoading(false);
        return;
      }
      
      const userRoleData = roles[0];
      setUserRole(userRoleData.role as 'parent' | 'child');
      let familyId: string | null = userRoleData.family_id;
      
      // If user is a child, get family_id via the children table
      if (!familyId && userRoleData.child_id) {
        const { data: childData, error: childError } = await supabase
          .from('children')
          .select('family_id')
          .eq('id', userRoleData.child_id)
          .single();
        
        if (childError) {
          console.error('Error fetching child family:', childError);
          setLoading(false);
          return;
        }
        
        familyId = childData?.family_id || null;
        
        // For child users, automatically set their child as the active one
        if (userRoleData.child_id && !activeChildId) {
          setActiveChildId(userRoleData.child_id);
        }
      }
      
      if (!familyId) {
        setLoading(false);
        return;
      }
      
      // Get family
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .maybeSingle();
      
      if (familyError) {
        console.error('Error fetching family:', familyError);
      }
      
      if (familyData) setFamily(familyData);
      
      // Get children
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at');
      
      if (childrenError) {
        console.error('Error fetching children:', childrenError);
      }
      
      if (childrenData) {
        // For child users, filter to only their own child
        const filteredChildren = userRoleData.role === 'child' && userRoleData.child_id
          ? childrenData.filter(c => c.id === userRoleData.child_id)
          : childrenData;
        
        setChildren(filteredChildren);
        
        // For child users, always lock to their own child
        if (userRoleData.role === 'child' && userRoleData.child_id) {
          setActiveChildId(userRoleData.child_id);
        } else {
          // Check if stored activeChildId is still valid
          const storedId = localStorage.getItem(ACTIVE_CHILD_KEY);
          const validChild = storedId && filteredChildren.some(c => c.id === storedId);
          
          if (filteredChildren.length > 0 && !validChild) {
            setActiveChildId(filteredChildren[0].id);
          } else if (storedId && validChild && activeChildId !== storedId) {
            setActiveChildIdState(storedId);
          }
        }
      }
      
      // Get homework with tasks
      const childIds = childrenData?.map(c => c.id) || [];
      if (childIds.length > 0) {
        const { data: homeworkData, error: homeworkError } = await supabase
          .from('homework')
          .select('*')
          .in('child_id', childIds);
        
        if (homeworkError) {
          console.error('Error fetching homework:', homeworkError);
        }
        
        if (homeworkData && homeworkData.length > 0) {
          // Get all tasks for these homework items
          const { data: tasksData, error: tasksError } = await supabase
            .from('study_tasks')
            .select('*')
            .in('homework_id', homeworkData.map(h => h.id));
          
          if (tasksError) {
            console.error('Error fetching tasks:', tasksError);
          }
          
          const homeworkWithTasks: HomeworkWithTasks[] = homeworkData.map(hw => ({
            ...hw,
            tasks: tasksData?.filter(t => t.homework_id === hw.id) || [],
          }));
          
          setHomework(homeworkWithTasks);
        } else {
          setHomework([]);
        }
        
        // Get recurring pack items
        const { data: packItemsData, error: packItemsError } = await supabase
          .from('recurring_pack_items')
          .select('*')
          .in('child_id', childIds);
        
        if (packItemsError) {
          console.error('Error fetching recurring pack items:', packItemsError);
        }
        
        if (packItemsData) {
          setRecurringPackItems(packItemsData);
        }
        
        // Get adhoc tasks
        const { data: adhocData, error: adhocError } = await supabase
          .from('adhoc_tasks')
          .select('*')
          .in('child_id', childIds);
        
        if (adhocError) {
          console.error('Error fetching adhoc tasks:', adhocError);
        }
        
        if (adhocData) {
          setAdhocTasks(adhocData);
        }
      }
    } catch (err) {
      console.error('Error fetching family data:', err);
    } finally {
      setLoading(false);
    }
  }, [user, activeChildId]);
  
  useEffect(() => {
    fetchFamilyData();
  }, [fetchFamilyData]);
  
  // Set up realtime subscriptions
  useEffect(() => {
    if (!family?.id) return;
    
    const homeworkChannel = supabase
      .channel('homework-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'homework' },
        () => fetchFamilyData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'study_tasks' },
        () => fetchFamilyData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'children' },
        () => fetchFamilyData()
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(homeworkChannel);
    };
  }, [family?.id, fetchFamilyData]);
  
  // Add child
  const addChild = async (name: string, color: string) => {
    if (!family) return null;
    
    const { data, error } = await supabase
      .from('children')
      .insert({ family_id: family.id, name, color })
      .select()
      .single();
    
    if (error) {
      toast.error('Kunde inte lägga till barn');
      return null;
    }
    
    toast.success(`${name} tillagt! 👋`);
    return data;
  };
  
  // Add homework
  const addHomework = async (homeworkData: {
    title: string;
    subject: string;
    description?: string;
    dueDate: string;
    bringToSchool?: string[];
    childId: string;
    reminderDate?: string;
    isRecurring?: boolean;
    recurrenceDays?: number[];
    recurrenceEndDate?: string;
    submissionDay?: number;
    homeworkType?: 'inlamning' | 'forhor';
  }) => {
    const { data, error } = await supabase
      .from('homework')
      .insert({
        title: homeworkData.title,
        subject: homeworkData.subject,
        description: homeworkData.description,
        due_date: homeworkData.dueDate,
        bring_to_school: homeworkData.bringToSchool,
        child_id: homeworkData.childId,
        reminder_date: homeworkData.reminderDate,
        is_recurring: homeworkData.isRecurring || false,
        recurrence_days: homeworkData.recurrenceDays,
        recurrence_end_date: homeworkData.recurrenceEndDate,
        submission_day: homeworkData.submissionDay,
        homework_type: homeworkData.homeworkType || 'inlamning',
      })
      .select()
      .single();
    
    if (error) {
      toast.error('Kunde inte lägga till läxa');
      return null;
    }
    
    toast.success('Läxa tillagd! 📚');
    return data;
  };

  // Update homework
  const updateHomework = async (homeworkId: string, updates: {
    title?: string;
    subject?: string;
    description?: string;
    dueDate?: string;
    bringToSchool?: string[];
    reminderDate?: string | null;
    isRecurring?: boolean;
    recurrenceDays?: number[];
    recurrenceEndDate?: string;
    submissionDay?: number | null;
    homeworkType?: string;
  }) => {
    const updateData: Record<string, unknown> = {};
    
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.subject !== undefined) updateData.subject = updates.subject;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
    if (updates.bringToSchool !== undefined) updateData.bring_to_school = updates.bringToSchool;
    if (updates.reminderDate !== undefined) updateData.reminder_date = updates.reminderDate;
    if (updates.isRecurring !== undefined) updateData.is_recurring = updates.isRecurring;
    if (updates.recurrenceDays !== undefined) updateData.recurrence_days = updates.recurrenceDays;
    if (updates.recurrenceEndDate !== undefined) updateData.recurrence_end_date = updates.recurrenceEndDate;
    if (updates.submissionDay !== undefined) updateData.submission_day = updates.submissionDay;
    if (updates.homeworkType !== undefined) updateData.homework_type = updates.homeworkType;

    const { error } = await supabase
      .from('homework')
      .update(updateData)
      .eq('id', homeworkId);
    
    if (error) {
      toast.error('Kunde inte uppdatera läxa');
      return false;
    }
    
    toast.success('Läxa uppdaterad! ✓');
    return true;
  };
  
  // Add task
  const addTask = async (homeworkId: string, title: string, date: string) => {
    const { error } = await supabase
      .from('study_tasks')
      .insert({
        homework_id: homeworkId,
        title,
        task_date: date,
      });
    
    if (error) {
      toast.error('Kunde inte lägga till uppgift');
      return false;
    }
    
    return true;
  };

  // Delete task
  const deleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from('study_tasks')
      .delete()
      .eq('id', taskId);
    
    if (error) {
      toast.error('Kunde inte ta bort uppgift');
      return false;
    }
    
    await fetchFamilyData();
    return true;
  };
  
  // Toggle task completion
  const toggleTask = async (taskId: string, completed: boolean) => {
    const { data: task, error } = await supabase
      .from('study_tasks')
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        snoozed_until: null, // Clear snooze when completing
      })
      .eq('id', taskId)
      .select('*, homework:homework_id(*)')
      .single();
    
    if (error) {
      toast.error('Kunde inte uppdatera uppgift');
      return { allCompleted: false, homework: null };
    }
    
    // Check if all tasks for this homework are completed
    const hw = homework.find(h => h.id === task.homework_id);
    if (!hw) return { allCompleted: false, homework: null };
    
    const updatedTasks = hw.tasks.map(t => 
      t.id === taskId ? { ...t, completed } : t
    );
    const allCompleted = updatedTasks.every(t => t.completed);
    
    if (allCompleted && !hw.completed) {
      await supabase
        .from('homework')
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq('id', hw.id);
    }
    
    // Always refetch to ensure UI is in sync
    await fetchFamilyData();
    
    return { allCompleted, homework: hw };
  };
  
  // Snooze task until tomorrow (with due date validation)
  const snoozeTask = async (taskId: string, homeworkDueDate?: string) => {
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    
    // If due date is provided, validate that we're not snoozing past it
    if (homeworkDueDate && tomorrow > homeworkDueDate) {
      toast.error('Kan inte snooza förbi deadline');
      return false;
    }
    
    const { error } = await supabase
      .from('study_tasks')
      .update({ snoozed_until: tomorrow })
      .eq('id', taskId);
    
    if (error) {
      toast.error('Kunde inte snooze:a uppgiften');
      return false;
    }
    
    toast.success('Uppgiften snoozad till imorgon 💤');
    await fetchFamilyData();
    return true;
  };
  
  // Unsnooze task
  const unsnoozeTask = async (taskId: string) => {
    const { error } = await supabase
      .from('study_tasks')
      .update({ snoozed_until: null })
      .eq('id', taskId);
    
    if (error) {
      toast.error('Kunde inte ta bort snooze');
      return false;
    }
    
    return true;
  };
  
  // Delete homework
  const deleteHomework = async (id: string) => {
    const { error } = await supabase
      .from('homework')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast.error('Kunde inte ta bort läxa');
      return false;
    }
    
    toast.success('Läxa borttagen');
    return true;
  };
  
  // Schedule more practice
  const scheduleMorePractice = async (homeworkId: string, days: number[]) => {
    const today = new Date();
    const tasks = days.map((d, index) => ({
      homework_id: homeworkId,
      title: `Övningspass ${index + 1}`,
      task_date: format(addDays(today, d), 'yyyy-MM-dd'),
    }));
    
    const { error: tasksError } = await supabase
      .from('study_tasks')
      .insert(tasks);
    
    if (tasksError) {
      toast.error('Kunde inte schemalägga övning');
      return false;
    }
    
    await supabase
      .from('homework')
      .update({ 
        needs_more_practice: true, 
        completed: false,
        completed_at: null,
      })
      .eq('id', homeworkId);
    
    toast.success('Övningspass schemalagda! 📖');
    return true;
  };
  
  // Get homework for active child
  const getHomeworkForChild = (childId: string) => {
    return homework.filter(hw => hw.child_id === childId);
  };
  
  // Get tasks for a specific date (includes snoozed tasks and overdue tasks)
  const getTasksForDate = (childId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return homework
      .filter(hw => hw.child_id === childId)
      .flatMap(hw => 
        hw.tasks
          .filter(t => {
            // Include if: task is scheduled for this date AND not snoozed to a future date
            const isScheduledToday = t.task_date === dateStr && 
              (!t.snoozed_until || t.snoozed_until <= dateStr);
            
            // OR: task was snoozed UNTIL this date (it "wakes up" today)
            const isSnoozedToToday = t.snoozed_until === dateStr;
            
            // OR: task is from a previous day, not completed, and not snoozed to a future date
            const isOverdue = !t.completed && 
              t.task_date < dateStr && 
              (!t.snoozed_until || t.snoozed_until <= dateStr) &&
              // Don't show if snoozed to a specific future date (already handled by isSnoozedToToday)
              t.snoozed_until !== dateStr;
            
            return isScheduledToday || isSnoozedToToday || isOverdue;
          })
          .map(task => {
            // Calculate how many days old the task is
            const diffMs = date.getTime() - new Date(task.task_date + 'T00:00:00').getTime();
            const daysOld = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
            
            return { 
              task, 
              homework: hw,
              wasSnoozed: task.snoozed_until === dateStr,
              daysOld,
            };
          })
      );
  };
  
  // Get items to bring for a specific date (includes both homework items and recurring pack items)
  const getItemsToBringForDate = (childId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = getDay(date);
    
    // Get homework items due on this date
    const homeworkItems = homework
      .filter(
        hw =>
          hw.child_id === childId &&
          hw.due_date === dateStr &&
          hw.bring_to_school &&
          hw.bring_to_school.length > 0
      )
      .map(hw => ({ homework: hw, items: hw.bring_to_school || [] }));
    
    // Get recurring pack items for this weekday
    const recurringItems = recurringPackItems.filter(
      item => item.child_id === childId && item.weekdays.includes(dayOfWeek)
    );
    
    return { homeworkItems, recurringItems };
  };
  
  // Add recurring pack item
  const addRecurringPackItem = async (childId: string, itemName: string, weekdays: number[]) => {
    const { error } = await supabase
      .from('recurring_pack_items')
      .insert({
        child_id: childId,
        item_name: itemName,
        weekdays,
      });
    
    if (error) {
      toast.error('Kunde inte lägga till packningssak');
      return false;
    }
    
    toast.success('Packningssak tillagd! 🎒');
    await fetchFamilyData();
    return true;
  };
  
  // Delete recurring pack item
  const deleteRecurringPackItem = async (id: string) => {
    const { error } = await supabase
      .from('recurring_pack_items')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast.error('Kunde inte ta bort packningssak');
      return false;
    }
    
    await fetchFamilyData();
    return true;
  };
  
  // Get recurring pack items for a child
  const getRecurringPackItemsForChild = (childId: string) => {
    return recurringPackItems.filter(item => item.child_id === childId);
  };
  
  // Add adhoc task
  const addAdhocTask = async (childId: string, title: string, taskDate: string) => {
    const { error } = await supabase
      .from('adhoc_tasks')
      .insert({
        child_id: childId,
        title,
        task_date: taskDate,
      });
    
    if (error) {
      toast.error('Kunde inte lägga till uppgift');
      return false;
    }
    
    toast.success('Extra uppgift tillagd! ⭐');
    await fetchFamilyData();
    return true;
  };
  
  // Toggle adhoc task completion
  const toggleAdhocTask = async (taskId: string, completed: boolean) => {
    const { error } = await supabase
      .from('adhoc_tasks')
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq('id', taskId);
    
    if (error) {
      toast.error('Kunde inte uppdatera uppgift');
      return false;
    }
    
    await fetchFamilyData();
    return true;
  };
  
  // Delete adhoc task
  const deleteAdhocTask = async (taskId: string) => {
    const { error } = await supabase
      .from('adhoc_tasks')
      .delete()
      .eq('id', taskId);
    
    if (error) {
      toast.error('Kunde inte ta bort uppgift');
      return false;
    }
    
    await fetchFamilyData();
    return true;
  };
  
  // Get adhoc tasks for a specific date
  const getAdhocTasksForDate = (childId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return adhocTasks.filter(
      task => task.child_id === childId && task.task_date === dateStr
    );
  };
  
  return {
    family,
    children,
    homework,
    recurringPackItems,
    adhocTasks,
    activeChildId,
    setActiveChildId,
    loading,
    userRole,
    addChild,
    addHomework,
    updateHomework,
    addTask,
    deleteTask,
    toggleTask,
    snoozeTask,
    unsnoozeTask,
    deleteHomework,
    scheduleMorePractice,
    getHomeworkForChild,
    getTasksForDate,
    getItemsToBringForDate,
    addRecurringPackItem,
    deleteRecurringPackItem,
    getRecurringPackItemsForChild,
    addAdhocTask,
    toggleAdhocTask,
    deleteAdhocTask,
    getAdhocTasksForDate,
    refetch: fetchFamilyData,
  };
}
