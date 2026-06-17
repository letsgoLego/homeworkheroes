import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, startOfWeek, addDays } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

export type HolidayGoalType = Database['public']['Enums']['holiday_goal_type'];

export interface HolidayMode {
  id: string;
  child_id: string;
  active: boolean;
  started_at: string | null;
  ends_at: string | null;
}

export interface HolidayGoal {
  id: string;
  child_id: string;
  name: string;
  emoji: string;
  type: HolidayGoalType;
  daily_target: number | null;
  total_target: number | null;
  color: string;
  sort_order: number;
  archived: boolean;
  created_at: string;
}

export interface HolidayGoalEntry {
  id: string;
  goal_id: string;
  entry_date: string;
  value: number;
}

export const GOAL_COLORS = ['#2eb8a6', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981'];

export function useHolidayMode(childId: string | null) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['holiday-mode', childId],
    enabled: !!childId,
    queryFn: async () => {
      if (!childId) return { mode: null, goals: [], entries: [] };

      const [{ data: modeRow }, { data: goalsRows }] = await Promise.all([
        supabase.from('holiday_modes').select('*').eq('child_id', childId).maybeSingle(),
        supabase.from('holiday_goals').select('*').eq('child_id', childId).eq('archived', false).order('sort_order'),
      ]);

      const goals = (goalsRows || []) as HolidayGoal[];
      let entries: HolidayGoalEntry[] = [];
      if (goals.length > 0) {
        const goalIds = goals.map(g => g.id);
        // Fetch entries from the last 60 days
        const since = format(addDays(new Date(), -60), 'yyyy-MM-dd');
        const { data: entriesRows } = await supabase
          .from('holiday_goal_entries')
          .select('*')
          .in('goal_id', goalIds)
          .gte('entry_date', since);
        entries = (entriesRows || []) as HolidayGoalEntry[];
      }

      return {
        mode: (modeRow as HolidayMode | null) ?? null,
        goals,
        entries,
      };
    },
  });

  const mode = data?.mode ?? null;
  const goals = data?.goals ?? [];
  const entries = data?.entries ?? [];

  // Auto-end holiday if past end date
  const isActive = !!mode?.active && (!mode.ends_at || mode.ends_at >= format(new Date(), 'yyyy-MM-dd'));

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['holiday-mode', childId] });
  }, [qc, childId]);

  const startHoliday = async (endsAt: string | null) => {
    if (!childId) return false;
    const payload = {
      child_id: childId,
      active: true,
      started_at: new Date().toISOString(),
      ends_at: endsAt,
      created_by: user?.id ?? null,
    };
    // Upsert by child_id
    const { error } = await supabase
      .from('holiday_modes')
      .upsert(payload, { onConflict: 'child_id' });
    if (error) {
      toast.error('Kunde inte starta lovläge');
      return false;
    }
    toast.success('🌴 Lovläge aktiverat!');
    invalidate();
    return true;
  };

  const endHoliday = async () => {
    if (!childId || !mode) return false;
    const { error } = await supabase
      .from('holiday_modes')
      .update({ active: false, ends_at: null })
      .eq('child_id', childId);
    if (error) {
      toast.error('Kunde inte avsluta lovläge');
      return false;
    }
    toast.success('Tillbaka till normalläge ✨');
    invalidate();
    return true;
  };

  const createGoal = async (input: {
    name: string;
    emoji: string;
    type: HolidayGoalType;
    daily_target?: number | null;
    total_target?: number | null;
    color?: string;
  }) => {
    if (!childId) return false;
    if (goals.length >= 3) {
      toast.error('Max 3 mål per lov');
      return false;
    }
    const { error } = await supabase.from('holiday_goals').insert({
      child_id: childId,
      name: input.name,
      emoji: input.emoji,
      type: input.type,
      daily_target: input.daily_target ?? null,
      total_target: input.total_target ?? null,
      color: input.color ?? GOAL_COLORS[goals.length % GOAL_COLORS.length],
      sort_order: goals.length,
    });
    if (error) {
      toast.error('Kunde inte skapa mål');
      return false;
    }
    invalidate();
    return true;
  };

  const deleteGoal = async (goalId: string) => {
    const { error } = await supabase.from('holiday_goals').update({ archived: true }).eq('id', goalId);
    if (error) {
      toast.error('Kunde inte ta bort mål');
      return false;
    }
    invalidate();
    return true;
  };

  const updateGoal = async (goalId: string, patch: Partial<Pick<HolidayGoal, 'name' | 'emoji' | 'type' | 'daily_target' | 'total_target' | 'color'>>) => {
    const { error } = await supabase.from('holiday_goals').update(patch).eq('id', goalId);
    if (error) {
      toast.error('Kunde inte spara ändringar');
      return false;
    }
    toast.success('Mål uppdaterat');
    invalidate();
    return true;
  };

  const setEntryValue = async (goalId: string, date: string, value: number) => {
    // Optimistic
    qc.setQueryData(['holiday-mode', childId], (old: any) => {
      if (!old) return old;
      const existing = old.entries.find((e: HolidayGoalEntry) => e.goal_id === goalId && e.entry_date === date);
      const newEntries = existing
        ? old.entries.map((e: HolidayGoalEntry) =>
            e.goal_id === goalId && e.entry_date === date ? { ...e, value } : e
          )
        : [...old.entries, { id: `tmp-${goalId}-${date}`, goal_id: goalId, entry_date: date, value }];
      return { ...old, entries: newEntries };
    });

    const { error } = await supabase
      .from('holiday_goal_entries')
      .upsert(
        { goal_id: goalId, entry_date: date, value: Math.max(0, value) },
        { onConflict: 'goal_id,entry_date' }
      );
    if (error) {
      toast.error('Kunde inte spara');
      invalidate();
      return false;
    }
    return true;
  };

  const getEntryValue = (goalId: string, date: string): number => {
    const e = entries.find(en => en.goal_id === goalId && en.entry_date === date);
    return e?.value ?? 0;
  };

  const getEntriesForGoal = (goalId: string): HolidayGoalEntry[] =>
    entries.filter(e => e.goal_id === goalId);

  const getWeekEntries = (goalId: string, weekStart: Date) => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = addDays(weekStart, i);
      const ds = format(d, 'yyyy-MM-dd');
      return { date: d, dateStr: ds, value: getEntryValue(goalId, ds) };
    });
  };

  // Rolling last 7 days ending today
  const getLast7Days = (goalId: string) => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = addDays(new Date(), -6 + i);
      const ds = format(d, 'yyyy-MM-dd');
      return { date: d, dateStr: ds, value: getEntryValue(goalId, ds) };
    });
  };

  const getGoalStreak = (goalId: string): number => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return 0;
    const isCheckbox = goal.type === 'checkbox_per_day';
    const isTotal = goal.type === 'total_for_holiday';
    let s = 0;
    for (let i = 0; i < 365; i++) {
      const ds = format(addDays(new Date(), -i), 'yyyy-MM-dd');
      const v = getEntryValue(goalId, ds);
      const hit = (isCheckbox || isTotal) ? v > 0 : v >= (goal.daily_target ?? 1);
      if (hit) s++;
      else break;
    }
    return s;
  };

  const getGoalTotal = (goalId: string): number =>
    entries.filter(e => e.goal_id === goalId).reduce((a, e) => a + (e.value || 0), 0);

  const getPerfectDays = (): string[] => {
    if (goals.length === 0) return [];
    const dateSet = new Set(entries.map(e => e.entry_date));
    const result: string[] = [];
    dateSet.forEach(date => {
      const allHit = goals.every(g => {
        const v = getEntryValue(g.id, date);
        if (g.type === 'checkbox_per_day' || g.type === 'total_for_holiday') return v > 0;
        return v >= (g.daily_target ?? 1);
      });
      if (allHit) result.push(date);
    });
    return result.sort();
  };

  const isPerfectToday = (): boolean => {
    if (goals.length === 0) return false;
    const today = format(new Date(), 'yyyy-MM-dd');
    return goals.every(g => {
      const v = getEntryValue(g.id, today);
      if (g.type === 'checkbox_per_day' || g.type === 'total_for_holiday') return v > 0;
      return v >= (g.daily_target ?? 1);
    });
  };

  const getHolidayXp = () => {
    let xp = 0;
    for (const e of entries) {
      if ((e.value || 0) <= 0) continue;
      const goal = goals.find(g => g.id === e.goal_id);
      if (!goal) continue;
      xp += 10;
      const isCheckbox = goal.type === 'checkbox_per_day';
      const isTotal = goal.type === 'total_for_holiday';
      const hit = (isCheckbox || isTotal) ? e.value > 0 : e.value >= (goal.daily_target ?? 1);
      if (hit && !isCheckbox) xp += 15;
    }
    xp += getPerfectDays().length * 50;
    const thresholds = [0, 50, 150, 300, 500, 800, 1200, 1700, 2300, 3000, 4000];
    const titles = [
      '🌱 Lovstartare', '🏖️ Strandvandrare', '☀️ Solpiraten', '🍦 Glassmästaren',
      '🏊 Vågsurfaren', '🚀 Lov-raket', '🏝️ Ö-äventyraren', '🎢 Tivolikungen',
      '👑 Lov-mästare', '🏆 Lov-legend', '🌟 Lov-superstjärna',
    ];
    let level = 0;
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (xp >= thresholds[i]) { level = i; break; }
    }
    const curr = thresholds[level];
    const next = thresholds[level + 1] ?? curr + 1000;
    return { xp, level, title: titles[Math.min(level, titles.length - 1)], xpToNext: next - curr, xpInLevel: xp - curr };
  };

  return {
    loading: isLoading,
    mode,
    goals,
    entries,
    isActive,
    startHoliday,
    endHoliday,
    createGoal,
    deleteGoal,
    updateGoal,
    setEntryValue,
    getEntryValue,
    getEntriesForGoal,
    getWeekEntries,
    getLast7Days,
    getGoalStreak,
    getGoalTotal,
    getPerfectDays,
    isPerfectToday,
    getHolidayXp,
    invalidate,
  };
}

export function getCurrentWeekStart(): Date {
  return startOfWeek(new Date(), { weekStartsOn: 1 });
}
