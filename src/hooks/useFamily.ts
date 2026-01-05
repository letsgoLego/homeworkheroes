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

export function useFamily() {
  const { user } = useAuth();
  const [family, setFamily] = useState<Family | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [homework, setHomework] = useState<HomeworkWithTasks[]>([]);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch family and children
  const fetchFamilyData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      // Get user's family via user_roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('family_id')
        .eq('user_id', user.id)
        .limit(1);
      
      if (!roles || roles.length === 0) {
        setLoading(false);
        return;
      }
      
      const familyId = roles[0].family_id;
      
      // Get family
      const { data: familyData } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .single();
      
      if (familyData) setFamily(familyData);
      
      // Get children
      const { data: childrenData } = await supabase
        .from('children')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at');
      
      if (childrenData) {
        setChildren(childrenData);
        if (childrenData.length > 0 && !activeChildId) {
          setActiveChildId(childrenData[0].id);
        }
      }
      
      // Get homework with tasks
      const { data: homeworkData } = await supabase
        .from('homework')
        .select('*')
        .in('child_id', childrenData?.map(c => c.id) || []);
      
      if (homeworkData) {
        // Get all tasks for these homework items
        const { data: tasksData } = await supabase
          .from('study_tasks')
          .select('*')
          .in('homework_id', homeworkData.map(h => h.id));
        
        const homeworkWithTasks: HomeworkWithTasks[] = homeworkData.map(hw => ({
          ...hw,
          tasks: tasksData?.filter(t => t.homework_id === hw.id) || [],
        }));
        
        setHomework(homeworkWithTasks);
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
      toast.error('Failed to add child');
      return null;
    }
    
    toast.success(`${name} added! 👋`);
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
      })
      .select()
      .single();
    
    if (error) {
      toast.error('Failed to add homework');
      return null;
    }
    
    toast.success('Homework added! 📚');
    return data;
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
      toast.error('Failed to add task');
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
      })
      .eq('id', taskId)
      .select('*, homework:homework_id(*)')
      .single();
    
    if (error) {
      toast.error('Failed to update task');
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
  
  // Delete homework
  const deleteHomework = async (id: string) => {
    const { error } = await supabase
      .from('homework')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast.error('Failed to delete homework');
      return false;
    }
    
    toast.success('Homework deleted');
    return true;
  };
  
  // Schedule more practice
  const scheduleMorePractice = async (homeworkId: string, days: number[]) => {
    const today = new Date();
    const tasks = days.map((d, index) => ({
      homework_id: homeworkId,
      title: `Practice session ${index + 1}`,
      task_date: format(addDays(today, d), 'yyyy-MM-dd'),
    }));
    
    const { error: tasksError } = await supabase
      .from('study_tasks')
      .insert(tasks);
    
    if (tasksError) {
      toast.error('Failed to schedule practice');
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
    
    toast.success('Practice sessions scheduled! 📖');
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
    addChild,
    addHomework,
    addTask,
    toggleTask,
    deleteHomework,
    scheduleMorePractice,
    getHomeworkForChild,
    getTasksForDate,
    getItemsToBringForDate,
    refetch: fetchFamilyData,
  };
}
