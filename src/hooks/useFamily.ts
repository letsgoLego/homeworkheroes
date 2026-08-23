import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, addDays, getDay, subDays } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';
import { useFamilyData } from './queries/useFamilyData';
import { useHomeworkData, type HomeworkWithTasks, type Activity, type InboxHomework } from './queries/useHomeworkData';

type Child = Tables<'children'>;
type Family = Tables<'families'>;
type RecurringPackItem = Tables<'recurring_pack_items'>;
type AdhocTask = Tables<'adhoc_tasks'>;

const ACTIVE_CHILD_KEY = 'laxhjalpen_active_child';
const DEBOUNCE_MS = 1000;

export function useFamily() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeChildId, setActiveChildIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ACTIVE_CHILD_KEY);
    }
    return null;
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setActiveChildId = useCallback((id: string | null) => {
    setActiveChildIdState(id);
    if (id) {
      localStorage.setItem(ACTIVE_CHILD_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_CHILD_KEY);
    }
  }, []);

  // React Query: family data
  const { data: familyData, isLoading: familyLoading, error: familyError } = useFamilyData(user?.id);

  const family = familyData?.family ?? null;
  const children = familyData?.children ?? [];
  const userRole = familyData?.role ?? null;

  // Set active child based on role
  useEffect(() => {
    if (!familyData) return;
    if (familyData.role === 'child' && familyData.childId) {
      setActiveChildId(familyData.childId);
    } else if (familyData.children.length > 0) {
      const storedId = localStorage.getItem(ACTIVE_CHILD_KEY);
      const validChild = storedId && familyData.children.some(c => c.id === storedId);
      if (!validChild) {
        setActiveChildId(familyData.children[0].id);
      } else if (storedId && activeChildId !== storedId) {
        setActiveChildIdState(storedId);
      }
    }
  }, [familyData]);

  // React Query: homework data
  const childIds = useMemo(() => children.map(c => c.id), [children]);
  const { data: hwData, isLoading: hwLoading } = useHomeworkData(childIds);

  const homework = hwData?.homework ?? [];
  const inboxHomework = hwData?.inboxHomework ?? [];
  const recurringPackItems = hwData?.recurringPackItems ?? [];
  const adhocTasks = hwData?.adhocTasks ?? [];
  const activities = hwData?.activities ?? [];

  const loading = familyLoading || (childIds.length > 0 && hwLoading);

  // Invalidate helpers
  const invalidateHomework = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['homework-data', childIds] });
  }, [queryClient, childIds]);

  const invalidateFamily = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['family-data', user?.id] });
  }, [queryClient, user?.id]);

  const refetch = useCallback(async () => {
    await Promise.all([invalidateFamily(), invalidateHomework()]);
  }, [invalidateFamily, invalidateHomework]);

  // Debounced refetch for realtime
  const debouncedRefetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      invalidateHomework();
    }, DEBOUNCE_MS);
  }, [invalidateHomework]);

  // Realtime subscription
  useEffect(() => {
    if (!family?.id) return;
    const channel = supabase
      .channel('homework-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'homework' }, () => debouncedRefetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_tasks' }, () => debouncedRefetch())
      .subscribe();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [family?.id, debouncedRefetch]);

  // --- Mutations (keep optimistic updates via queryClient.setQueryData) ---

  const setHomeworkOptimistic = useCallback((updater: (prev: HomeworkWithTasks[]) => HomeworkWithTasks[]) => {
    queryClient.setQueryData(['homework-data', childIds], (old: any) => {
      if (!old) return old;
      return { ...old, homework: updater(old.homework) };
    });
  }, [queryClient, childIds]);

  const setAdhocTasksOptimistic = useCallback((updater: (prev: AdhocTask[]) => AdhocTask[]) => {
    queryClient.setQueryData(['homework-data', childIds], (old: any) => {
      if (!old) return old;
      return { ...old, adhocTasks: updater(old.adhocTasks) };
    });
  }, [queryClient, childIds]);

  const setPackItemsOptimistic = useCallback((updater: (prev: RecurringPackItem[]) => RecurringPackItem[]) => {
    queryClient.setQueryData(['homework-data', childIds], (old: any) => {
      if (!old) return old;
      return { ...old, recurringPackItems: updater(old.recurringPackItems) };
    });
  }, [queryClient, childIds]);

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
    invalidateFamily();
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
    invalidateHomework();
    return data;
  };

  // Send homework to child's inbox (parent fills step 1, child plans the days)
  const sendHomeworkToChild = async (input: {
    title: string;
    subject: string;
    description?: string;
    dueDate: string;
    childId: string;
    homeworkType?: 'inlamning' | 'forhor';
    items?: string[];
  }) => {
    const { data, error } = await supabase
      .from('homework')
      .insert({
        title: input.title,
        subject: input.subject,
        description: input.description,
        due_date: input.dueDate,
        child_id: input.childId,
        homework_type: input.homeworkType || 'inlamning',
        planning_status: 'pending',
        created_by: user?.id ?? null,
      })
      .select()
      .single();
    if (error || !data) {
      toast.error('Kunde inte skicka läxan');
      return null;
    }
    const items = (input.items || []).map(t => t.trim()).filter(Boolean);
    if (items.length > 0) {
      const { error: itemsError } = await supabase
        .from('homework_plan_items')
        .insert(items.map((title, i) => ({ homework_id: data.id, title, sort_order: i })));
      if (itemsError) toast.error('Kunde inte spara alla delmoment');
    }
    toast.success('Skickat till barnet att planera! 📥');
    invalidateHomework();
    return data;
  };

  // Child plans an inbox homework: create study tasks on chosen days
  const planHomework = async (
    homeworkId: string,
    assignments: { title: string; date: string }[]
  ) => {
    const valid = assignments.filter(a => a.title.trim() && a.date);
    if (valid.length === 0) {
      toast.error('Välj minst en dag');
      return false;
    }
    const { error: tasksError } = await supabase
      .from('study_tasks')
      .insert(valid.map(a => ({ homework_id: homeworkId, title: a.title.trim(), task_date: a.date })));
    if (tasksError) {
      toast.error('Kunde inte spara planeringen');
      return false;
    }
    const { error } = await supabase
      .from('homework')
      .update({ planning_status: 'planned', planned_at: new Date().toISOString() })
      .eq('id', homeworkId);
    if (error) {
      toast.error('Kunde inte spara planeringen');
      return false;
    }
    await supabase.from('homework_plan_items').delete().eq('homework_id', homeworkId);
    toast.success('Planerat! 🎉');
    invalidateHomework();
    return true;
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
    invalidateHomework();
    return true;
  };

  // Add task
  const addTask = async (homeworkId: string, title: string, date: string) => {
    const { error } = await supabase
      .from('study_tasks')
      .insert({ homework_id: homeworkId, title, task_date: date });
    if (error) {
      toast.error('Kunde inte lägga till uppgift');
      return false;
    }
    invalidateHomework();
    return true;
  };

  // Optimistic delete task
  const deleteTask = async (taskId: string) => {
    setHomeworkOptimistic(prev => prev.map(hw => ({
      ...hw,
      tasks: hw.tasks.filter(t => t.id !== taskId),
    })));
    const { error } = await supabase.from('study_tasks').delete().eq('id', taskId);
    if (error) {
      toast.error('Kunde inte ta bort uppgift');
      invalidateHomework();
      return false;
    }
    return true;
  };

  // Optimistic toggle task
  const toggleTask = async (taskId: string, completed: boolean) => {
    const hw = homework.find(h => h.tasks.some(t => t.id === taskId));
    if (!hw) return { allCompleted: false, homework: null };

    const updatedTasks = hw.tasks.map(t =>
      t.id === taskId ? { ...t, completed, completed_at: completed ? new Date().toISOString() : null, snoozed_until: null } : t
    );
    const allCompleted = updatedTasks.every(t => t.completed);

    setHomeworkOptimistic(prev => prev.map(h => {
      if (h.id !== hw.id) return h;
      return {
        ...h,
        tasks: updatedTasks,
        completed: allCompleted ? true : h.completed,
        completed_at: allCompleted && !h.completed ? new Date().toISOString() : h.completed_at,
      };
    }));

    const { error } = await supabase
      .from('study_tasks')
      .update({ completed, completed_at: completed ? new Date().toISOString() : null, snoozed_until: null })
      .eq('id', taskId);
    if (error) {
      toast.error('Kunde inte uppdatera uppgift');
      invalidateHomework();
      return { allCompleted: false, homework: null };
    }
    if (allCompleted && !hw.completed) {
      await supabase.from('homework')
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq('id', hw.id);
    }
    return { allCompleted, homework: hw };
  };

  // Optimistic snooze task
  const snoozeTask = async (taskId: string, homeworkDueDate?: string) => {
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    if (homeworkDueDate && tomorrow > homeworkDueDate) {
      toast.error('Kan inte snooza förbi deadline');
      return false;
    }
    setHomeworkOptimistic(prev => prev.map(hw => ({
      ...hw,
      tasks: hw.tasks.map(t => t.id === taskId ? { ...t, snoozed_until: tomorrow } : t),
    })));
    const { error } = await supabase.from('study_tasks').update({ snoozed_until: tomorrow }).eq('id', taskId);
    if (error) {
      toast.error('Kunde inte snooze:a uppgiften');
      invalidateHomework();
      return false;
    }
    toast.success('Uppgiften snoozad till imorgon 💤');
    return true;
  };

  // Optimistic unsnooze task
  const unsnoozeTask = async (taskId: string) => {
    setHomeworkOptimistic(prev => prev.map(hw => ({
      ...hw,
      tasks: hw.tasks.map(t => t.id === taskId ? { ...t, snoozed_until: null } : t),
    })));
    const { error } = await supabase.from('study_tasks').update({ snoozed_until: null }).eq('id', taskId);
    if (error) {
      toast.error('Kunde inte ta bort snooze');
      invalidateHomework();
      return false;
    }
    return true;
  };

  // Delete homework
  const deleteHomework = async (id: string) => {
    const { error } = await supabase.from('homework').delete().eq('id', id);
    if (error) {
      toast.error('Kunde inte ta bort läxa');
      return false;
    }
    toast.success('Läxa borttagen');
    invalidateHomework();
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
    const { error: tasksError } = await supabase.from('study_tasks').insert(tasks);
    if (tasksError) {
      toast.error('Kunde inte schemalägga övning');
      return false;
    }
    await supabase.from('homework')
      .update({ needs_more_practice: true, completed: false, completed_at: null })
      .eq('id', homeworkId);
    toast.success('Övningspass schemalagda! 📖');
    invalidateHomework();
    return true;
  };

  const getHomeworkForChild = (childId: string) => homework.filter(hw => hw.child_id === childId);

  const getTasksForDate = (childId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return homework
      .filter(hw => hw.child_id === childId)
      .flatMap(hw =>
        hw.tasks
          .filter(t => {
            const isScheduledToday = t.task_date === dateStr && (!t.snoozed_until || t.snoozed_until <= dateStr);
            const isSnoozedToToday = t.snoozed_until === dateStr;
            const isOverdue = !t.completed && t.task_date < dateStr && (!t.snoozed_until || t.snoozed_until <= dateStr) && t.snoozed_until !== dateStr;
            return isScheduledToday || isSnoozedToToday || isOverdue;
          })
          .map(task => {
            const diffMs = date.getTime() - new Date(task.task_date + 'T00:00:00').getTime();
            const daysOld = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
            return { task, homework: hw, wasSnoozed: task.snoozed_until === dateStr, daysOld };
          })
      );
  };

  const getItemsToBringForDate = (childId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = getDay(date);
    const homeworkItems = homework
      .filter(hw => hw.child_id === childId && hw.due_date === dateStr && hw.bring_to_school && hw.bring_to_school.length > 0)
      .map(hw => ({ homework: hw, items: hw.bring_to_school || [] }));
    const recurringItems = recurringPackItems.filter(
      item => item.child_id === childId && item.weekdays.includes(dayOfWeek)
    );
    return { homeworkItems, recurringItems };
  };

  const addRecurringPackItem = async (childId: string, itemName: string, weekdays: number[]) => {
    const { error } = await supabase
      .from('recurring_pack_items')
      .insert({ child_id: childId, item_name: itemName, weekdays });
    if (error) {
      toast.error('Kunde inte lägga till packningssak');
      return false;
    }
    toast.success('Packningssak tillagd! 🎒');
    invalidateHomework();
    return true;
  };

  const deleteRecurringPackItem = async (id: string) => {
    setPackItemsOptimistic(prev => prev.filter(item => item.id !== id));
    const { error } = await supabase.from('recurring_pack_items').delete().eq('id', id);
    if (error) {
      toast.error('Kunde inte ta bort packningssak');
      invalidateHomework();
      return false;
    }
    return true;
  };

  const getRecurringPackItemsForChild = (childId: string) =>
    recurringPackItems.filter(item => item.child_id === childId);

  // Optimistic add adhoc task
  const addAdhocTask = async (childId: string, title: string, taskDate: string) => {
    const { data, error } = await supabase
      .from('adhoc_tasks')
      .insert({ child_id: childId, title, task_date: taskDate })
      .select()
      .single();
    if (error) {
      toast.error('Kunde inte lägga till uppgift');
      return false;
    }
    if (data) {
      setAdhocTasksOptimistic(prev => [...prev, data]);
    }
    toast.success('Extra uppgift tillagd! ⭐');
    return true;
  };

  // Optimistic toggle adhoc task
  const toggleAdhocTask = async (taskId: string, completed: boolean) => {
    setAdhocTasksOptimistic(prev => prev.map(t =>
      t.id === taskId ? { ...t, completed, completed_at: completed ? new Date().toISOString() : null } : t
    ));
    const { error } = await supabase
      .from('adhoc_tasks')
      .update({ completed, completed_at: completed ? new Date().toISOString() : null })
      .eq('id', taskId);
    if (error) {
      toast.error('Kunde inte uppdatera uppgift');
      invalidateHomework();
      return false;
    }
    return true;
  };

  // Optimistic delete adhoc task
  const deleteAdhocTask = async (taskId: string) => {
    setAdhocTasksOptimistic(prev => prev.filter(t => t.id !== taskId));
    const { error } = await supabase.from('adhoc_tasks').delete().eq('id', taskId);
    if (error) {
      toast.error('Kunde inte ta bort uppgift');
      invalidateHomework();
      return false;
    }
    return true;
  };

  const getAdhocTasksForDate = (childId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return adhocTasks.filter(task => task.child_id === childId && task.task_date === dateStr);
  };

  const toggleHomeworkComplete = async (homeworkId: string, completed: boolean) => {
    setHomeworkOptimistic(prev => prev.map(hw => {
      if (hw.id !== homeworkId) return hw;
      return { ...hw, completed, completed_at: completed ? new Date().toISOString() : null };
    }));
    const { error } = await supabase
      .from('homework')
      .update({ completed, completed_at: completed ? new Date().toISOString() : null })
      .eq('id', homeworkId);
    if (error) {
      toast.error('Kunde inte uppdatera läxa');
      invalidateHomework();
    }
  };

  const getActiveHomeworkCount = (childId: string) =>
    homework.filter(hw => hw.child_id === childId && !hw.completed).length;

  // Activities CRUD
  const addActivity = async (childId: string, activityData: {
    title: string;
    emoji: string;
    weekdays: number[];
    specificDate?: string;
    startTime?: string;
    endTime?: string;
  }) => {
    const { error } = await supabase
      .from('activities')
      .insert({
        child_id: childId,
        title: activityData.title,
        emoji: activityData.emoji,
        weekdays: activityData.weekdays,
        specific_date: activityData.specificDate || null,
        start_time: activityData.startTime || null,
        end_time: activityData.endTime || null,
      });
    if (error) {
      toast.error('Kunde inte lägga till aktivitet');
      return false;
    }
    toast.success('Aktivitet tillagd! 🎉');
    invalidateHomework();
    return true;
  };

  const updateActivity = async (id: string, activityData: {
    title: string;
    emoji: string;
    weekdays: number[];
    specificDate?: string;
    startTime?: string;
    endTime?: string;
    endDate?: string | null;
    excludedDates?: string[];
  }) => {
    const { error } = await supabase
      .from('activities')
      .update({
        title: activityData.title,
        emoji: activityData.emoji,
        weekdays: activityData.weekdays,
        specific_date: activityData.specificDate || null,
        start_time: activityData.startTime || null,
        end_time: activityData.endTime || null,
        end_date: activityData.endDate || null,
        ...(activityData.excludedDates ? { excluded_dates: activityData.excludedDates } : {}),
      })
      .eq('id', id);
    if (error) {
      toast.error('Kunde inte uppdatera aktivitet');
      return false;
    }
    toast.success('Hela serien uppdaterad! ✏️');
    invalidateHomework();
    return true;
  };

  const deleteActivity = async (id: string) => {
    const { error } = await supabase.from('activities').delete().eq('id', id);
    if (error) {
      toast.error('Kunde inte ta bort aktivitet');
      return false;
    }
    toast.success('Serien borttagen');
    invalidateHomework();
    return true;
  };

  /** Hoppa över ett enstaka datum utan att röra resten av serien */
  const skipActivityDate = async (id: string, date: string) => {
    const activity = activities.find(a => a.id === id);
    const current = activity?.excluded_dates ?? [];
    if (current.includes(date)) return true;
    const { error } = await supabase
      .from('activities')
      .update({ excluded_dates: [...current, date].sort() })
      .eq('id', id);
    if (error) {
      toast.error('Kunde inte hoppa över dagen');
      return false;
    }
    toast.success('Aktiviteten hoppas över den dagen');
    invalidateHomework();
    return true;
  };

  /** Ångra ett hoppat datum */
  const unskipActivityDate = async (id: string, date: string) => {
    const activity = activities.find(a => a.id === id);
    const current = activity?.excluded_dates ?? [];
    const { error } = await supabase
      .from('activities')
      .update({ excluded_dates: current.filter(d => d !== date) })
      .eq('id', id);
    if (error) {
      toast.error('Kunde inte återställa dagen');
      return false;
    }
    toast.success('Dagen är tillbaka');
    invalidateHomework();
    return true;
  };

  const getActivitiesForDate = (childId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = getDay(date);
    return activities.filter(a => {
      if (a.child_id !== childId) return false;
      if ((a.excluded_dates ?? []).includes(dateStr)) return false;
      if (a.end_date && dateStr > a.end_date) return false;
      // Recurring: matches weekday
      if (a.weekdays.length > 0 && a.weekdays.includes(dayOfWeek)) return true;
      // One-off: matches specific date
      if (a.specific_date === dateStr) return true;
      return false;
    });
  };


  return {
    family,
    children,
    homework,
    inboxHomework,
    recurringPackItems,
    adhocTasks,
    activities,
    activeChildId,
    setActiveChildId,
    loading,
    userRole,
    familyError,
    getActiveHomeworkCount,
    addChild,
    addHomework,
    sendHomeworkToChild,
    planHomework,
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
    toggleHomeworkComplete,
    addActivity,
    updateActivity,
    deleteActivity,

    getActivitiesForDate,
    refetch,
  };
}
