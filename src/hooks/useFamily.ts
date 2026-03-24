import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, addDays, getDay, subDays } from 'date-fns';
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
const DEBOUNCE_MS = 1000;

export function useFamily() {
  const { user } = useAuth();
  const [family, setFamily] = useState<Family | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [homework, setHomework] = useState<HomeworkWithTasks[]>([]);
  const [recurringPackItems, setRecurringPackItems] = useState<RecurringPackItem[]>([]);
  const [adhocTasks, setAdhocTasks] = useState<AdhocTask[]>([]);
  const [userRole, setUserRole] = useState<'parent' | 'child' | null>(null);
  const [activeChildId, setActiveChildIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ACTIVE_CHILD_KEY);
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  // Debounce timer ref for realtime
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setActiveChildId = useCallback((id: string | null) => {
    setActiveChildIdState(id);
    if (id) {
      localStorage.setItem(ACTIVE_CHILD_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_CHILD_KEY);
    }
  }, []);
  
  // Fetch family and children — optimized with combined query and date filter
  const fetchFamilyData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
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
        
        if (userRoleData.child_id && !activeChildId) {
          setActiveChildId(userRoleData.child_id);
        }
      }
      
      if (!familyId) {
        setLoading(false);
        return;
      }
      
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .maybeSingle();
      
      if (familyError) {
        console.error('Error fetching family:', familyError);
      }
      
      if (familyData) setFamily(familyData);
      
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at');
      
      if (childrenError) {
        console.error('Error fetching children:', childrenError);
      }
      
      if (childrenData) {
        const filteredChildren = userRoleData.role === 'child' && userRoleData.child_id
          ? childrenData.filter(c => c.id === userRoleData.child_id)
          : childrenData;
        
        setChildren(filteredChildren);
        
        if (userRoleData.role === 'child' && userRoleData.child_id) {
          setActiveChildId(userRoleData.child_id);
        } else {
          const storedId = localStorage.getItem(ACTIVE_CHILD_KEY);
          const validChild = storedId && filteredChildren.some(c => c.id === storedId);
          
          if (filteredChildren.length > 0 && !validChild) {
            setActiveChildId(filteredChildren[0].id);
          } else if (storedId && validChild && activeChildId !== storedId) {
            setActiveChildIdState(storedId);
          }
        }
      }
      
      const childIds = childrenData?.map(c => c.id) || [];
      if (childIds.length > 0) {
        // Optimization 3: Filter by date range (30 days back)
        const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
        
        // Optimization 4: Combined query — fetch homework with tasks in one request
        const { data: homeworkData, error: homeworkError } = await supabase
          .from('homework')
          .select('*, study_tasks(*)')
          .in('child_id', childIds)
          .or(`due_date.gte.${thirtyDaysAgo},completed.eq.false`);
        
        if (homeworkError) {
          console.error('Error fetching homework:', homeworkError);
        }
        
        if (homeworkData) {
          const homeworkWithTasks: HomeworkWithTasks[] = homeworkData.map((hw: any) => ({
            ...hw,
            tasks: hw.study_tasks || [],
            study_tasks: undefined,
          }));
          setHomework(homeworkWithTasks);
        } else {
          setHomework([]);
        }
        
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
  
  // Debounced refetch for realtime events
  const debouncedRefetch = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchFamilyData();
    }, DEBOUNCE_MS);
  }, [fetchFamilyData]);

  useEffect(() => {
    fetchFamilyData();
  }, [fetchFamilyData]);
  
  // Optimization 1 & 5: Debounced realtime, removed children table
  useEffect(() => {
    if (!family?.id) return;
    
    const channel = supabase
      .channel('homework-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'homework' },
        () => debouncedRefetch()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'study_tasks' },
        () => debouncedRefetch()
      )
      .subscribe();
    
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [family?.id, debouncedRefetch]);
  
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

  // Optimization 2: Optimistic delete task
  const deleteTask = async (taskId: string) => {
    // Optimistic update
    setHomework(prev => prev.map(hw => ({
      ...hw,
      tasks: hw.tasks.filter(t => t.id !== taskId),
    })));

    const { error } = await supabase
      .from('study_tasks')
      .delete()
      .eq('id', taskId);
    
    if (error) {
      toast.error('Kunde inte ta bort uppgift');
      await fetchFamilyData(); // Revert on error
      return false;
    }
    
    return true;
  };
  
  // Optimization 2: Optimistic toggle task
  const toggleTask = async (taskId: string, completed: boolean) => {
    // Find the homework containing this task before optimistic update
    const hw = homework.find(h => h.tasks.some(t => t.id === taskId));
    if (!hw) return { allCompleted: false, homework: null };

    // Optimistic update
    const updatedTasks = hw.tasks.map(t =>
      t.id === taskId ? { ...t, completed, completed_at: completed ? new Date().toISOString() : null, snoozed_until: null } : t
    );
    const allCompleted = updatedTasks.every(t => t.completed);

    setHomework(prev => prev.map(h => {
      if (h.id !== hw.id) return h;
      return {
        ...h,
        tasks: updatedTasks,
        completed: allCompleted ? true : h.completed,
        completed_at: allCompleted && !h.completed ? new Date().toISOString() : h.completed_at,
      };
    }));

    // DB mutation
    const { error } = await supabase
      .from('study_tasks')
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        snoozed_until: null,
      })
      .eq('id', taskId);
    
    if (error) {
      toast.error('Kunde inte uppdatera uppgift');
      await fetchFamilyData(); // Revert on error
      return { allCompleted: false, homework: null };
    }
    
    if (allCompleted && !hw.completed) {
      await supabase
        .from('homework')
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq('id', hw.id);
    }
    
    return { allCompleted, homework: hw };
  };
  
  // Optimization 2: Optimistic snooze task
  const snoozeTask = async (taskId: string, homeworkDueDate?: string) => {
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    
    if (homeworkDueDate && tomorrow > homeworkDueDate) {
      toast.error('Kan inte snooza förbi deadline');
      return false;
    }

    // Optimistic update
    setHomework(prev => prev.map(hw => ({
      ...hw,
      tasks: hw.tasks.map(t => t.id === taskId ? { ...t, snoozed_until: tomorrow } : t),
    })));
    
    const { error } = await supabase
      .from('study_tasks')
      .update({ snoozed_until: tomorrow })
      .eq('id', taskId);
    
    if (error) {
      toast.error('Kunde inte snooze:a uppgiften');
      await fetchFamilyData();
      return false;
    }
    
    toast.success('Uppgiften snoozad till imorgon 💤');
    return true;
  };
  
  // Optimization 2: Optimistic unsnooze task
  const unsnoozeTask = async (taskId: string) => {
    // Optimistic update
    setHomework(prev => prev.map(hw => ({
      ...hw,
      tasks: hw.tasks.map(t => t.id === taskId ? { ...t, snoozed_until: null } : t),
    })));

    const { error } = await supabase
      .from('study_tasks')
      .update({ snoozed_until: null })
      .eq('id', taskId);
    
    if (error) {
      toast.error('Kunde inte ta bort snooze');
      await fetchFamilyData();
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
  
  const getHomeworkForChild = (childId: string) => {
    return homework.filter(hw => hw.child_id === childId);
  };
  
  const getTasksForDate = (childId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return homework
      .filter(hw => hw.child_id === childId)
      .flatMap(hw => 
        hw.tasks
          .filter(t => {
            const isScheduledToday = t.task_date === dateStr && 
              (!t.snoozed_until || t.snoozed_until <= dateStr);
            const isSnoozedToToday = t.snoozed_until === dateStr;
            const isOverdue = !t.completed && 
              t.task_date < dateStr && 
              (!t.snoozed_until || t.snoozed_until <= dateStr) &&
              t.snoozed_until !== dateStr;
            
            return isScheduledToday || isSnoozedToToday || isOverdue;
          })
          .map(task => {
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
  
  const getItemsToBringForDate = (childId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = getDay(date);
    
    const homeworkItems = homework
      .filter(
        hw =>
          hw.child_id === childId &&
          hw.due_date === dateStr &&
          hw.bring_to_school &&
          hw.bring_to_school.length > 0
      )
      .map(hw => ({ homework: hw, items: hw.bring_to_school || [] }));
    
    const recurringItems = recurringPackItems.filter(
      item => item.child_id === childId && item.weekdays.includes(dayOfWeek)
    );
    
    return { homeworkItems, recurringItems };
  };
  
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
  
  const deleteRecurringPackItem = async (id: string) => {
    const { error } = await supabase
      .from('recurring_pack_items')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast.error('Kunde inte ta bort packningssak');
      return false;
    }
    
    // Optimistic update
    setRecurringPackItems(prev => prev.filter(item => item.id !== id));
    return true;
  };
  
  const getRecurringPackItemsForChild = (childId: string) => {
    return recurringPackItems.filter(item => item.child_id === childId);
  };
  
  // Optimization 2: Optimistic add adhoc task
  const addAdhocTask = async (childId: string, title: string, taskDate: string) => {
    const { data, error } = await supabase
      .from('adhoc_tasks')
      .insert({
        child_id: childId,
        title,
        task_date: taskDate,
      })
      .select()
      .single();
    
    if (error) {
      toast.error('Kunde inte lägga till uppgift');
      return false;
    }
    
    // Optimistic update with real data
    if (data) {
      setAdhocTasks(prev => [...prev, data]);
    }
    
    toast.success('Extra uppgift tillagd! ⭐');
    return true;
  };
  
  // Optimization 2: Optimistic toggle adhoc task
  const toggleAdhocTask = async (taskId: string, completed: boolean) => {
    // Optimistic update
    setAdhocTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, completed, completed_at: completed ? new Date().toISOString() : null } : t
    ));

    const { error } = await supabase
      .from('adhoc_tasks')
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq('id', taskId);
    
    if (error) {
      toast.error('Kunde inte uppdatera uppgift');
      await fetchFamilyData();
      return false;
    }
    
    return true;
  };
  
  // Optimization 2: Optimistic delete adhoc task
  const deleteAdhocTask = async (taskId: string) => {
    // Optimistic update
    setAdhocTasks(prev => prev.filter(t => t.id !== taskId));

    const { error } = await supabase
      .from('adhoc_tasks')
      .delete()
      .eq('id', taskId);
    
    if (error) {
      toast.error('Kunde inte ta bort uppgift');
      await fetchFamilyData();
      return false;
    }
    
    return true;
  };
  
  const getAdhocTasksForDate = (childId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return adhocTasks.filter(
      task => task.child_id === childId && task.task_date === dateStr
    );
  };

  const toggleHomeworkComplete = async (homeworkId: string, completed: boolean) => {
    // Optimistic update
    setHomework(prev => prev.map(hw => {
      if (hw.id !== homeworkId) return hw;
      return {
        ...hw,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      };
    }));

    const { error } = await supabase
      .from('homework')
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq('id', homeworkId);

    if (error) {
      toast.error('Kunde inte uppdatera läxa');
      await fetchFamilyData();
    }
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
