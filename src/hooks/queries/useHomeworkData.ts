import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type Homework = Tables<'homework'>;
type StudyTask = Tables<'study_tasks'>;
type RecurringPackItem = Tables<'recurring_pack_items'>;
type AdhocTask = Tables<'adhoc_tasks'>;

export interface Activity {
  id: string;
  child_id: string;
  title: string;
  emoji: string;
  weekdays: number[];
  specific_date: string | null;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
}

export interface HomeworkWithTasks extends Homework {
  tasks: StudyTask[];
}

interface HomeworkDataResult {
  homework: HomeworkWithTasks[];
  recurringPackItems: RecurringPackItem[];
  adhocTasks: AdhocTask[];
  activities: Activity[];
}

async function fetchHomeworkData(childIds: string[]): Promise<HomeworkDataResult> {
  if (childIds.length === 0) {
    return { homework: [], recurringPackItems: [], adhocTasks: [] };
  }

  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

  const [hwRes, packRes, adhocRes] = await Promise.all([
    supabase
      .from('homework')
      .select('*, study_tasks(*)')
      .in('child_id', childIds)
      .or(`due_date.gte.${thirtyDaysAgo},completed.eq.false`),
    supabase
      .from('recurring_pack_items')
      .select('*')
      .in('child_id', childIds),
    supabase
      .from('adhoc_tasks')
      .select('*')
      .in('child_id', childIds),
  ]);

  if (hwRes.error) throw hwRes.error;
  if (packRes.error) throw packRes.error;
  if (adhocRes.error) throw adhocRes.error;

  const homework: HomeworkWithTasks[] = (hwRes.data || []).map((hw: any) => ({
    ...hw,
    tasks: hw.study_tasks || [],
    study_tasks: undefined,
  }));

  return {
    homework,
    recurringPackItems: packRes.data || [],
    adhocTasks: adhocRes.data || [],
  };
}

export function useHomeworkData(childIds: string[]) {
  return useQuery({
    queryKey: ['homework-data', childIds],
    queryFn: () => fetchHomeworkData(childIds),
    enabled: childIds.length > 0,
    staleTime: 2 * 60 * 1000, // 2 min
    gcTime: 10 * 60 * 1000,
  });
}
