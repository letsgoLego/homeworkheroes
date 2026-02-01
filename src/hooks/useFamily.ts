import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type Child = Tables<'children'>;
type Homework = Tables<'homework'>;
type StudyTask = Tables<'study_tasks'>;
type Family = Tables<'families'>;

interface HomeworkWithTasks extends Homework {
  tasks: StudyTask[];
}

const ACTIVE_CHILD_KEY = 'laxhjalpen_active_child';

export function useFamily() {
  const { user } = useAuth();
  const [family, setFamily] = useState<Family | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [homework, setHomework] = useState<HomeworkWithTasks[]>([]);
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
        setChildren(childrenData);
        // Check if stored activeChildId is still valid
        const storedId = localStorage.getItem(ACTIVE_CHILD_KEY);
        const validChild = storedId && childrenData.some(c => c.id === storedId);
        
        if (childrenData.length > 0 && !validChild) {
          setActiveChildId(childrenData[0].id);
        } else if (storedId && validChild && activeChildId !== storedId) {
          // Sync state with localStorage if different
          setActiveChildIdState(storedId);
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
    
    return { allCompleted, homework: hw };
  };
  
  // Snooze task until tomorrow
  const snoozeTask = async (taskId: string) => {
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    
    const { error } = await supabase
      .from('study_tasks')
      .update({ snoozed_until: tomorrow })
      .eq('id', taskId);
    
    if (error) {
      toast.error('Kunde inte snooze:a uppgiften');
      return false;
    }
    
    toast.success('Uppgiften snoozad till imorgon 💤');
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
  
  // Get tasks for a specific date
  const getTasksForDate = (childId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return homework
      .filter(hw => hw.child_id === childId)
      .flatMap(hw => 
        hw.tasks
          .filter(t => t.task_date === dateStr)
          .map(task => ({ task, homework: hw }))
      );
  };
  
  // Get items to bring for a specific date
  const getItemsToBringForDate = (childId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return homework
      .filter(
        hw =>
          hw.child_id === childId &&
          hw.due_date === dateStr &&
          hw.bring_to_school &&
          hw.bring_to_school.length > 0
      )
      .map(hw => ({ homework: hw, items: hw.bring_to_school || [] }));
  };
  
  return {
    family,
    children,
    homework,
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
    refetch: fetchFamilyData,
  };
}
